import moment from "moment-timezone";
import { logger, level } from "../../config/logger/logger";
import Devices from "../../models/device.model";
import { mqttClient } from "../../config/mqtt/mqtt";
import { getHAXValue, getDecimalValue } from "../../helpers/utility";
import { CONSTANTS as MESSAGE } from "../../constants/messages/messageId";

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
        let { pmac, vmac, startDate, endDate, threshold, startTime, endTime } =
          device;
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

        const FA02payload = createFA02payload(msgId, pmac, vmac, threshold);
        const FA03payload = createFA03payload(
          msgId,
          startDate,
          endDate,
          startTime,
          endTime
        );

        //! for pump send FA02,FA03
        mqttClient.publish(PUMP_TOPIC, FA02payload);
        mqttClient.publish(PUMP_TOPIC, FA03payload);
        //! for valve send FA02,FA03
        mqttClient.publish(VALVE_TOPIC, FA02payload);
        mqttClient.publish(VALVE_TOPIC, FA03payload);
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

const createFA02payload = (msgId, pmac, vmac, threshold) => {
  threshold = getHAXValue(threshold);
  let payloadDataLength = "10";
  // AAAAFA02107C9EBD473CEC7C9EBD45C804000315B85555
  let FA02payload = `${START_DELIMETER}${msgId}${payloadDataLength}${pmac}${vmac}${threshold}${END_DELIMETER}`;
  return FA02payload;
};

const createFA03payload = (msgId, start, end, startTime, endTime) => {
  // AAAAFA030E24082021270820210206550406505555
  let payloadDataLength = "0E";
  let startDate = moment(start).format("DDMMYYYY");
  let endDate = moment(end).format("DDMMYYYY");
  startTime = getHHMMSS(startTime);
  endTime = getHHMMSS(endTime);
  let FA03payload = `${START_DELIMETER}${msgId}${payloadDataLength}${startDate}${endDate}${startTime}${endTime}${END_DELIMETER}`;
  return FA03payload;
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
    await Devices.updateData(
      {
        pmac,
      },
      { pstate: 1 }
    );
  } else if (recievedMACId === vmac) {
    // update vstate
    await Devices.updateData(
      {
        vmac,
      },
      { vstate: 1 }
    );
  }
};

export const PUMP_STATUS = async (macId, payload) => {
  try {
    let state = getStatusOfDeviceFA04(payload);
    let deviceExist = await Devices.isExist({ pmac: macId });
    if (deviceExist) {
      if (state === "00") {
        //  pump OFF
        await Devices.updateData(
          {
            pmac: macId,
          },
          {
            pumpCurrentstate: false,
            pumpLastUpdated: moment().format(),
          }
        );
      } else if (state === "01") {
        // pump ON
        await Devices.updateData(
          {
            pmac: macId,
          },
          {
            pstate: 1, //! this will make sure that when pump is on our pump controller is also online
            pumpCurrentstate: true,
            pumpLastUpdated: moment().format(),
          }
        );
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

const getStatusOfDeviceFA04 = (payload) => {
  let state = payload.slice(2, 4);
  return state;
};

export const VALVE_STATUS = async (macId, payload) => {
  try {
    let { state, totaliser_current_value } =
      getStatusAndThresholdOfDeviceFA05(payload);
    //! convert threshold hax in to decimal
    totaliser_current_value = getDecimalValue(totaliser_current_value);
    let deviceExist = await Devices.isExist({ vmac: macId });
    if (deviceExist) {
      if (state === "00") {
        //  valve OFF
        await Devices.updateData(
          {
            vmac: macId,
          },
          {
            valveCurrentstate: false,
            totaliser_current_value,
            valveLastUpdated: moment().format(),
          }
        );
      } else if (state === "01") {
        // valve ON
        await Devices.updateData(
          {
            vmac: macId,
          },
          {
            vstate: 1, //! this will make sure that when valve is on our valve controller is also online
            valveCurrentstate: true,
            totaliser_current_value,
            valveLastUpdated: moment().format(),
          }
        );
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

const getStatusAndThresholdOfDeviceFA05 = (payload) => {
  let state = payload.slice(2, 4);
  let totaliser_current_value = payload.slice(4);
  let data = { state, totaliser_current_value };
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
    let msgId = MESSAGE.FA03;
    const FA03payload = createFA03payload(
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
    mqttClient.publish(PUMP_TOPIC, FA03payload);
    mqttClient.publish(VALVE_TOPIC, FA03payload);
    return true;
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
  return true;
};
