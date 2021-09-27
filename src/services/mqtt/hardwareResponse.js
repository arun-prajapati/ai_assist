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
          operationMode,
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
        publishPumpOperationType(pmac, vmac, operationMode);
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
export const firmwareVersions = async (macId, payload) => {
  try {
    const recievedMACId = macId;

    let firmwareVersion = getFirmwareVersionOfDeviceFA02(payload);
    console.log(">>===", recievedMACId, payload, firmwareVersion);
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });
    if (device) {
      if (device.pstate !== 1 || device.vstate !== 1) {
        let {
          pmac,
          vmac,
          startDate,
          endDate,
          threshold,
          startTime,
          endTime,
          payloadInterval,
          operationMode,
        } = device;
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
        publishPumpOperationType(pmac, vmac, operationMode);
        mqttClient.publish(PUMP_TOPIC, FA03payload);
        mqttClient.publish(PUMP_TOPIC, FA04payload);
        //! for valve send FA02,FA03
        mqttClient.publish(VALVE_TOPIC, FA03payload);
        mqttClient.publish(VALVE_TOPIC, FA04payload);
      }
      let { pmac, vmac } = device;
      //! update either pump version orvalve version
      updateDeviceFirmwareVersion(recievedMACId, pmac, vmac, firmwareVersion);
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
//AAAAFA032210521C93F774C4DD576E4220
//000000160A5555
export const createFA03payload = (
  msgId,
  pmac,
  vmac,
  threshold,
  payloadInterval
) => {
  threshold = getHAXValue(8, threshold);
  console.log(">>before", payloadInterval);
  payloadInterval = getHAXValue(2, payloadInterval);
  let payloadDataLength = "22";
  // AAAAFA02107C9EBD473CEC7C9EBD45C804000315B85555
  console.log(">>", payloadInterval);
  let FA03payload = `${START_DELIMETER}${msgId}${payloadDataLength}${pmac}${vmac}${threshold}${payloadInterval}${END_DELIMETER}`;
  return FA03payload;
};

export const createFA04payload = (msgId, start, end, startTime, endTime) => {
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
const getFirmwareVersionOfDeviceFA02 = (payload) => {
  let version = payload.slice(2);
  return version;
};
const updateDeviceStatus = async (recievedMACId, pmac, vmac) => {
  if (recievedMACId === pmac) {
    // update pstate
    let updateDeviceData = await Devices.updateData(
      {
        pmac,
      },
      { pstate: 1, pumpLastUpdated: moment().format() }
    );
    // await DeviceSrv.addDeviceHistoryData(updateDeviceData);
  } else if (recievedMACId === vmac) {
    // update vstate
    let updateDeviceData = await Devices.updateData(
      {
        vmac,
      },
      { vstate: 1, valveLastUpdated: moment().format() }
    );
    //await DeviceSrv.addDeviceHistoryData(updateDeviceData);
  }
};
const updateDeviceFirmwareVersion = async (
  recievedMACId,
  pmac,
  vmac,
  firmwareVersion
) => {
  if (recievedMACId === pmac) {
    // update pump version
    await Devices.updateData(
      {
        pmac,
      },
      {
        pstate: 1,
        pumpLastUpdated: moment().format(),
        pumpVersion: firmwareVersion,
      }
    );
  } else if (recievedMACId === vmac) {
    // update valve version
    await Devices.updateData(
      {
        vmac,
      },
      {
        vstate: 1,
        valveLastUpdated: moment().format(),
        valveVersion: firmwareVersion,
      }
    );
  }
};

export const PUMP_STATUS = async (macId, payload) => {
  try {
    let state = getStatusOfDeviceFA05(payload);
    let deviceExist = await Devices.findOneDocument({ pmac: macId });
    if (deviceExist) {
      if (deviceExist.pstate !== 1) {
        let {
          pmac,
          vmac,
          startDate,
          endDate,
          threshold,
          startTime,
          endTime,
          payloadInterval,
          operationMode,
        } = deviceExist;
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
        publishPumpOperationType(pmac, vmac, operationMode);
        mqttClient.publish(PUMP_TOPIC, FA03payload);
        mqttClient.publish(PUMP_TOPIC, FA04payload);
        //! for valve send FA02,FA03
        mqttClient.publish(VALVE_TOPIC, FA03payload);
        mqttClient.publish(VALVE_TOPIC, FA04payload);
      }
      if (state === "00") {
        //  pump OFF
        let updateDeviceData = await Devices.updateData(
          {
            pmac: macId,
          },
          {
            pstate: 1,
            pumpCurrentstate: false,
            pumpLastUpdated: moment().format(),
          }
        );
        //await DeviceSrv.addDeviceHistoryData(updateDeviceData);
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
        //await DeviceSrv.addDeviceHistoryData(updateDeviceData);
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
    //! convert threshold hax in to decimal
    totaliser_current_value = getDecimalValue(totaliser_current_value);
    flowValue = getDecimalValue(flowValue);
    let deviceExist = await Devices.findOneDocument({ vmac: macId }); //findOne
    let deviceHistoryExist = await deviceHistory.isExist({ vmac: macId });
    if (deviceExist) {
      if (deviceExist.vstate !== 1) {
        let {
          pmac,
          vmac,
          startDate,
          endDate,
          threshold,
          startTime,
          endTime,
          payloadInterval,
          operationMode,
        } = deviceExist;
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
        publishPumpOperationType(pmac, vmac, operationMode);
        mqttClient.publish(PUMP_TOPIC, FA03payload);
        mqttClient.publish(PUMP_TOPIC, FA04payload);
        //! for valve send FA02,FA03
        mqttClient.publish(VALVE_TOPIC, FA03payload);
        mqttClient.publish(VALVE_TOPIC, FA04payload);
      }
      if (state === "00") {
        //  valve OFF
        let updateDeviceData = await Devices.updateData(
          {
            vmac: macId,
          },
          {
            vstate: 1,
            valveCurrentstate: false,
            totaliser_current_value,
            valveLastUpdated: moment().format(),
            flowValue: flowValue,
            flowUnit: flowunits,
          }
        );
        if (!deviceHistoryExist) {
          // updateDeviceData = JSON.parse(JSON.stringify(updateDeviceData));
          var dates = new Date(moment().tz("Asia/calcutta").format());
          dates.setDate(dates.getDate() - 1);
          console.log(">>dates", dates);
          updateDeviceData.date = new Date(new Date(dates).setHours(0, 0, 0));
          updateDeviceData.time = moment
            .tz(moment().format(), "Asia/calcutta")
            .format("hh:mm:ss");
          updateDeviceData.deviceId = updateDeviceData._id;
          delete updateDeviceData._id;
          await deviceHistory.createData(updateDeviceData);
          return true;
        }
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
        if (!deviceHistoryExist) {
          //updateDeviceData = JSON.parse(JSON.stringify(updateDeviceData));
          dates = new Date(moment().tz("Asia/calcutta").format());
          dates.setDate(dates.getDate() - 1);
          console.log(">>dates", dates);
          updateDeviceData.date = new Date(new Date(dates).setHours(0, 0, 0));
          updateDeviceData.time = moment
            .tz(moment().format(), "Asia/calcutta")
            .format("hh:mm:ss");
          updateDeviceData.deviceId = updateDeviceData._id;
          delete updateDeviceData._id;
          await deviceHistory.createData(updateDeviceData);
          return true;
        }
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
export const publishConfigurationMSG = async (deviceId) => {
  try {
    let deviceData = await Devices.findOneDocument({ _id: deviceId });
    console.log("deviceData", deviceData);
    let msgId = MESSAGE.FA03;
    const FA03payload = createFA03payload(
      msgId,
      deviceData.pmac,
      deviceData.vmac,
      deviceData.threshold,
      deviceData.payloadInterval
    );
    let PUMP_MAC = deviceData.pmac;
    let VALVE_MAC = deviceData.vmac;
    var PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, PUMP_MAC);
    var VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, VALVE_MAC);
    console.log(">>>", FA03payload);
    mqttClient.publish(PUMP_TOPIC, FA03payload);
    mqttClient.publish(VALVE_TOPIC, FA03payload);
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
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
  console.log(">>>opertaion minutes FA08)", operation, min);
  let FA08payload = `${START_DELIMETER}${msgId}${payloadDataLength}${operation}${min}${END_DELIMETER}`;
  return FA08payload;
};

export const createFA09payload = (url) => {
  let msgId = MESSAGE.FA09;
  let payloadDataLength = getHAXValue(2, url.length);
  console.log(">>payloadDATALENGTH", payloadDataLength);
  let FA09payload = `${START_DELIMETER}${msgId}${payloadDataLength}${url}${END_DELIMETER}`;
  return FA09payload;
};
const createFA07payload = (operation) => {
  let msgId = MESSAGE.FA07;
  let payloadDataLength = "02";
  operation = operation ? "01" : "00";
  let FA07payload = `${START_DELIMETER}${msgId}${payloadDataLength}${operation}${END_DELIMETER}`;
  return FA07payload;
};
export const handle_FA03_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let state = payload.slice(2, 4);
    console.log("state", state);
    //! get doc from DB using that mac if not exist then do nothing
    if (state !== "00") {
      let device = await Devices.findOneDocument({
        $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
      });

      if (device) {
        let { pmac, vmac, threshold, payloadInterval } = device;

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
        mqttClient.publish(PUMP_TOPIC, FA03payload);
        mqttClient.publish(VALVE_TOPIC, FA03payload);
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

export const handle_FA04_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let state = payload.slice(2, 4);
    console.log("state", state);
    //! get doc from DB using that mac if not exist then do nothing
    if (state !== "00") {
      let device = await Devices.findOneDocument({
        $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
      });

      if (device) {
        let { pmac, vmac, startDate, endDate, startTime, endTime } = device;

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
        const FA04payload = createFA04payload(
          MESSAGE.FA04,
          startDate,
          endDate,
          startTime,
          endTime
        );
        //pmac:B8F0098F81B0
        //vmac:083AF22BD318
        mqttClient.publish(PUMP_TOPIC, FA04payload);
        mqttClient.publish(VALVE_TOPIC, FA04payload);
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

export const handle_FA07_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let state = payload.slice(2, 4);
    console.log("state", state);
    //! get doc from DB using that mac if not exist then do nothing
    if (state !== "00") {
      console.log("inside ");
      let device = await Devices.findOneDocument({
        $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
      });
      if (device) {
        let { pmac, vmac, operationMode } = device;
        publishPumpOperationType(pmac, vmac, operationMode);
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

export const handle_FA08_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let state = payload.slice(2, 4);
    console.log("state", state);
    //! get doc from DB using that mac if not exist then do nothing
    if (state !== "00") {
      console.log("inside ");
      let device = await Devices.findOneDocument({
        $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
      });
      if (device) {
        let { pmac, vmac, pumpCurrentstate, pumpDuration } = device;
        publishPumpOperation(pmac, vmac, pumpCurrentstate, pumpDuration);
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

export const handle_FA09_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let state = payload.slice(2, 4);
    console.log("state", state);
    //! get doc from DB using that mac if not exist then do nothing
    if (state !== "00") {
      console.log("inside ");
      let device = await Devices.findOneDocument({
        $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
      });
      if (device) {
        let { pmac, vmac, url } = device;
        let FA09payload = createFA09payload(url);
        if (recievedMACId === pmac) {
          let PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, pmac);
          mqttClient.publish(PUMP_TOPIC, FA09payload);
        } else if (recievedMACId === vmac) {
          let VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, vmac);
          mqttClient.publish(VALVE_TOPIC, FA09payload);
        }
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
