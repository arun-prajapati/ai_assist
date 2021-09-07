import { logger, level } from "../../config/logger/logger";
import Devices from "../../models/device.model";
import moment from "moment-timezone";
import { mqttClient } from "../../config/mqtt/mqtt";

const START_DELIMETER = "AAAA";
const END_DELIMETER = "5555";
const REPLACE_DELIMETER = "*";
const CLOUD_TO_ESP_TOPIC = process.env.CLOUD_TO_ESP || "SensieTech/*/c2f";

export const DEVICE_CONNECTION = async (macId, msgId, payload) => {
  logger.log(level.info, `data : ${payload}${macId}`); //!remove log
  const recievedMACId = macId;
  let state = getStatusOfDevice(payload);
  // device online if state is '01'
  //! if 01 then only proceed frther otherwise if 00 do nothing
  if (state === "01") {
    // await Devices.createData(req.body);
    //! get doc from DB using that mac if not exist then do nothing
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });

    if (device) {
      let { pmac, vmac, startDate, endDate, threshold } = device;
      //! update either pstate or vstate to 1
      updateDeviceStatus(recievedMACId, pmac, vmac);

      // from macId get pump and valve id

      let PUMP_MAC = pmac; //pmac
      let VALVE_MAC = vmac;

      var PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, PUMP_MAC);
      var VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(
        REPLACE_DELIMETER,
        VALVE_MAC
      );

      const FA02payload = createFA02payload(msgId, pmac, vmac, threshold);
      const FA03payload = createFA03payload(msgId, startDate, endDate);

      //! for pump send FA02,FA03
      mqttClient.publish(PUMP_TOPIC, FA02payload);
      mqttClient.publish(PUMP_TOPIC, FA03payload);
      //! for valve send FA02,FA03
      mqttClient.publish(VALVE_TOPIC, FA02payload);
      mqttClient.publish(VALVE_TOPIC, FA03payload);
    }
  }
};

const createFA02payload = (msgId, pmac, vmac, threshold) => {
  threshold = getHAXValue(threshold);
  let payloadDataLength = "10";
  // AAAAFA02107C9EBD473CEC7C9EBD45C804000315B85555
  let FA02payload = `${START_DELIMETER}${msgId}${payloadDataLength}${pmac}${vmac}${threshold}${END_DELIMETER}`;
  return FA02payload;
};

const createFA03payload = (msgId, start, end) => {
  // AAAAFA030E24082021270820210206550406505555
  let payloadDataLength = "0E";
  let startDate = moment(start).format("DDMMYYYY");
  let endDate = moment(end).format("DDMMYYYY");
  let startTime = moment(start).tz("Asia/Calcutta").format("HHmmss");
  let endTime = moment(end).tz("Asia/Calcutta").format("HHmmss");
  let FA03payload = `${START_DELIMETER}${msgId}${payloadDataLength}${startDate}${endDate}${startTime}${endTime}${END_DELIMETER}`;
  return FA03payload;
};

const getStatusOfDevice = (payload) => {
  let state = payload.slice(2);
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

const getHAXValue = (value) => {
  let number = value;
  let hexStr = number.toString(16).toUpperCase().padStart(8, "0");
  return hexStr;
};
