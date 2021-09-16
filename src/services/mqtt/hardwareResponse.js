import moment from "moment-timezone";
import { logger, level } from "../../config/logger/logger";
import Devices from "../../models/device.model";
import { mqttClient } from "../../config/mqtt/mqtt";
import { getHAXValue, getDecimalValue, filterMac } from "../../helpers/utility";
import { CONSTANTS as MESSAGE } from "../../constants/messages/messageId";
import deviceHistory from "../../models/deviceHistory.model";
import * as DeviceSrv from "../../services/device/device.service";
import { flowUnit } from "../../constants/flowUnit";
const START_DELIMETER = "AAAA";
const END_DELIMETER = "5555";
const REPLACE_DELIMETER = "*";
const CLOUD_TO_ESP_TOPIC = process.env.CLOUD_TO_ESP || "SensieTech/*/c2f";

export const DEVICE_CONNECTION = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let state = getStatusOfDeviceFA01(payload);
    // device online if state is '01'
    //! if 01 then only proceed frther otherwise if 00 do nothing
    if (state === "01") {
      // await Devices.createData(req.body);
      //! get doc from DB using that mac if not exist then do nothing
      let device = await Devices.findOneDocument({
        $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
      });

      if (device) {
        let {
          pmac,
          vmac,
          startDate,
          endDate,
          threshold,
          startTime,
          endTime,
          payloadInterval,
        } = device;
        //! update either pstate or vstate to 1
        updateDeviceStatus(recievedMACId, pmac, vmac);

        // from macId get pump and valve id

        let PUMP_MAC = pmac; //pmac
        let VALVE_MAC = vmac;

        var PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(
          REPLACE_DELIMETER,
          PUMP_MAC
        );
        var VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(
          REPLACE_DELIMETER,
          VALVE_MAC
        );

        const FA03payload = createFA03payload(
          MESSAGE.FA03,
          pmac,
          vmac,
          threshold,
          payloadInterval
        );
        //pmac:B8F0098F81B0
        //vmac:083AF22BD318
        const FA04payload = createFA04payload(
          MESSAGE.FA04,
          startDate,
          endDate,
          startTime,
          endTime
        );
        console.log(">>pumptopic", PUMP_TOPIC);
        //! for pump send FA02,FA03
        mqttClient.publish(PUMP_TOPIC, FA03payload);
        mqttClient.publish(PUMP_TOPIC, FA04payload);
        //! for valve send FA02,FA03
        mqttClient.publish(VALVE_TOPIC, FA03payload);
        mqttClient.publish(VALVE_TOPIC, FA04payload);
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

const createFA03payload = (msgId, pmac, vmac, threshold, payloadInterval) => {
  threshold = getHAXValue(8, threshold);
  console.log(">>before", payloadInterval);
  payloadInterval = getHAXValue(2, payloadInterval);
  let payloadDataLength = "22";
  // AAAAFA02107C9EBD473CEC7C9EBD45C804000315B85555
  console.log(">>", payloadInterval);
  let FA03payload = `${START_DELIMETER}${msgId}${payloadDataLength}${pmac}${vmac}${threshold}${payloadInterval}${END_DELIMETER}`;
  return FA03payload;
};

const createFA04payload = (msgId, start, end, startTime, endTime) => {
  // AAAAFA030E24082021270820210206550406505555
  let payloadDataLength = "1C";
  // let startDate = moment(start).format("DDMMYYYY");
  // let endDate = moment(end).format("DDMMYYYY");
  let startDate = moment.tz(start, "Asia/calcutta").format("DDMMYYYY");
  let endDate = moment.tz(end, "Asia/calcutta").format("DDMMYYYY");

  // moment.tz('2021-09-16T18:30:00.000Z', "Asia/calcutta").format('DDMMYYYY')

  startTime = getHHMMSS(startTime);
  endTime = getHHMMSS(endTime);
  let FA04payload = `${START_DELIMETER}${msgId}${payloadDataLength}${startDate}${endDate}${startTime}${endTime}${END_DELIMETER}`;
  return FA04payload;
};

export const getHHMMSS = (timeData) => {
  const formatTime = timeData.split(":").join("");
  return formatTime;
};

const getStatusOfDeviceFA01 = (payload) => {
  let state = payload.slice(2, 4);
  return state;
};

const updateDeviceStatus = async (recievedMACId, pmac, vmac) => {
  if (recievedMACId === pmac) {
    // update pstate
    let updateDeviceData = await Devices.updateData(
      {
        pmac,
      },
      { pstate: 1 }
    );
    await DeviceSrv.addDeviceHistoryData(updateDeviceData);
  } else if (recievedMACId === vmac) {
    // update vstate
    let updateDeviceData = await Devices.updateData(
      {
        vmac,
      },
      { vstate: 1 }
    );
    await DeviceSrv.addDeviceHistoryData(updateDeviceData);
  }
};

export const PUMP_STATUS = async (macId, payload) => {
  try {
    let state = getStatusOfDeviceFA05(payload);
    let deviceExist = await Devices.isExist({ pmac: macId });
    if (deviceExist) {
      if (state === "00") {
        //  pump OFF
        let updateDeviceData = await Devices.updateData(
          {
            pmac: macId,
          },
          {
            pumpCurrentstate: false,
            pumpLastUpdated: moment().format(),
          }
        );
        await DeviceSrv.addDeviceHistoryData(updateDeviceData);
      } else if (state === "01") {
        // pump ON
        let updateDeviceData = await Devices.updateData(
          {
            pmac: macId,
          },
          {
            pstate: 1, //! this will make sure that when pump is on our pump controller is also online
            pumpCurrentstate: true,
            pumpLastUpdated: moment().format(),
          }
        );
        await DeviceSrv.addDeviceHistoryData(updateDeviceData);
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

const getStatusOfDeviceFA05 = (payload) => {
  let state = payload.slice(2, 4);
  return state;
};

export const VALVE_STATUS = async (macId, payload) => {
  try {
    let { state, totaliser_current_value, flowValue, flowunits } =
      getStatusAndThresholdOfDeviceFA06(payload);
    console.log("befire", totaliser_current_value);
    //! convert threshold hax in to decimal
    totaliser_current_value = getDecimalValue(totaliser_current_value);
    flowValue = getDecimalValue(flowValue);
    console.log("decimal value", totaliser_current_value);
    let deviceExist = await Devices.isExist({ vmac: macId });
    if (deviceExist) {
      if (state === "00") {
        //  valve OFF
        let updateDeviceData = await Devices.updateData(
          {
            vmac: macId,
          },
          {
            valveCurrentstate: false,
            totaliser_current_value,
            valveLastUpdated: moment().format(),
            flowValue: flowValue,
            flowUnit: flowunits,
          }
        );
        await DeviceSrv.addDeviceHistoryData(updateDeviceData);
      } else if (state === "01") {
        // valve ON
        let updateDeviceData = await Devices.updateData(
          {
            vmac: macId,
          },
          {
            vstate: 1, //! this will make sure that when valve is on our valve controller is also online
            valveCurrentstate: true,
            totaliser_current_value,
            valveLastUpdated: moment().format(),
            flowValue: flowValue,
            flowUnit: flowunits,
          }
        );
        await DeviceSrv.addDeviceHistoryData(updateDeviceData);
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

//AAAAFA06 0E00000315B85003 5555
const getStatusAndThresholdOfDeviceFA06 = (payload) => {
  console.log(">>>payload");
  let state = payload.slice(2, 4);
  let totaliser_current_value = payload.slice(4, 12);
  let flowValue = payload.slice(12, 14);
  let flowUnits = payload.slice(14, 16);
  console.log(
    ">>>",
    state,
    totaliser_current_value,
    flowValue,
    flowUnits
    //flowUnit[Number(flowUnits)]
  );
  let data = {
    state,
    totaliser_current_value,
    flowValue,
    flowunits: flowUnit[Number(flowUnits)],
  };
  return data;
};

//! When Schedule updated byb api
export const publishScheduleMSG = (
  deviceData,
  startDate,
  endDate,
  startTime,
  endTime
) => {
  try {
    let msgId = MESSAGE.FA04;
    const FA04payload = createFA04payload(
      msgId,
      startDate,
      endDate,
      startTime,
      endTime
    );
    let PUMP_MAC = deviceData.pmac;
    let VALVE_MAC = deviceData.vmac;
    var PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, PUMP_MAC);
    var VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, VALVE_MAC);
    console.log(PUMP_TOPIC, VALVE_TOPIC);
    mqttClient.publish(PUMP_TOPIC, FA04payload);
    mqttClient.publish(VALVE_TOPIC, FA04payload);
    return true;
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
  return true;
};

export const publishPumpOperation = async (pmac, vmac, operation, min) => {
  pmac = filterMac(pmac);
  //const FA07payload = createFA07payload(operation);
  const FA08payload = createFA08payload(operation, min);
  var PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, pmac);
  var VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, vmac);
  //mqttClient.publish(PUMP_TOPIC, FA07payload);
  //mqttClient.publish(VALVE_TOPIC, FA07payload);
  mqttClient.publish(PUMP_TOPIC, FA08payload);
  mqttClient.publish(VALVE_TOPIC, FA08payload);

  return true;
};
export const publishPumpOperationType = async (pmac, vmac, operation) => {
  pmac = filterMac(pmac);
  operation = operation === "manual" ? true : false;
  const FA07payload = createFA07payload(operation);
  var PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, pmac);
  var VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, vmac);
  mqttClient.publish(PUMP_TOPIC, FA07payload);
  mqttClient.publish(VALVE_TOPIC, FA07payload);
  return true;
};

// AAAA FA08 06 01 0212 5555
// AAAA FA08 06 00 0000 5555

const createFA08payload = (operation, min) => {
  let msgId = MESSAGE.FA08;
  let payloadDataLength = "06";
  let isOn = operation;
  min = isOn ? min : "0000";
  operation = operation ? "01" : "00";
  console.log(operation, min);
  let FA08payload = `${START_DELIMETER}${msgId}${payloadDataLength}${operation}${min}${END_DELIMETER}`;
  return FA08payload;
};
const createFA07payload = (operation) => {
  let msgId = MESSAGE.FA07;
  let payloadDataLength = "02";
  operation = operation ? "01" : "00";
  let FA07payload = `${START_DELIMETER}${msgId}${payloadDataLength}${operation}${END_DELIMETER}`;
  return FA07payload;
};
