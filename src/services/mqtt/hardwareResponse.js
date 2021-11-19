import moment from "moment-timezone";
import { logger, level } from "../../config/logger/logger";
import Devices from "../../models/device.model";
import { mqttClient } from "../../config/mqtt/mqtt";
import { getHAXValue, getDecimalValue, filterMac } from "../../helpers/utility";
import { CONSTANTS as MESSAGE } from "../../constants/messages/messageId";
import deviceHistory from "../../models/deviceHistory.model";
import AlertsHistory from "../../models/alerthistory.model";
import * as DeviceSrv from "../../services/device/device.service";
import { flowUnit } from "../../constants/flowUnit";
import Alerts from "../../models/alert.model";
import nodemailer from "nodemailer";
const mongoose = require("mongoose");
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
      // console.log("inside", device);
      if (device) {
        console.log("Inside ");
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

        console.log(">>FA04Payload", FA04payload);
        //! for pump send FA02,FA03
        publishPumpOperationType(pmac, vmac, operationMode);
        mqttClient.publish(PUMP_TOPIC, FA03payload);
        mqttClient.publish(PUMP_TOPIC, FA04payload);
        //! for valve send FA02,FA03
        mqttClient.publish(VALVE_TOPIC, FA03payload);
        mqttClient.publish(VALVE_TOPIC, FA04payload);
        console.log("Published Message After FA01");
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
  let FA04payload;
  let payloadDataLength = "1C";
  if (!start && !end && startTime === "" && endTime === "") {
    console.log("Inside  createFA04payload");
    FA04payload = `${START_DELIMETER}${msgId}${payloadDataLength}0000000000000000000000000000${END_DELIMETER}`;
  } else {
    // let startDate = moment(start).format("DDMMYYYY");
    // let endDate = moment(end).format("DDMMYYYY");
    let startDate = moment.tz(start, "Asia/calcutta").format("DDMMYYYY");
    let endDate = moment.tz(end, "Asia/calcutta").format("DDMMYYYY");
    // moment.tz('2021-09-16T18:30:00.000Z', "Asia/calcutta").format('DDMMYYYY')
    startTime = getHHMMSS(startTime);
    endTime = getHHMMSS(endTime);
    FA04payload = `${START_DELIMETER}${msgId}${payloadDataLength}${startDate}${endDate}${startTime}${endTime}${END_DELIMETER}`;
  }
  console.log(" FUnction FA04Payload", FA04payload);
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
    let deviceHistoryExist = await deviceHistory.isExist({ pmac: macId });
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
        updateDeviceData.updatedBy = "Pump";
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

        updateDeviceData.updatedBy = "Pump";
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
    if (((flowValue >> 15) & 1) == 1) {
      var x = new Int16Array(1);
      x[0] = flowValue;
      console.log(x[0]);
      flowValue = x[0];
    }
    console.log("Outside flow valuess", flowValue);
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
        updateDeviceData.updatedBy = "Valve";
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
        updateDeviceData.updatedBy = "Valve";
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
  let flowValue = payload.slice(12, 16);
  let flowUnits = payload.slice(16, 18);
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
  // mqttClient.publish(PUMP_TOPIC, FA07payload);
  // mqttClient.publish(VALVE_TOPIC, FA07payload);
  mqttClient.publish(PUMP_TOPIC, FA08payload, { qos: 2 }, (err, result) => {
    console.log(err);
    console.log(result);
  });
  mqttClient.publish(VALVE_TOPIC, FA08payload, { qos: 2 });

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
const GET_ERROR_MESSAGE = (msgFrameString, state) => {
  let message;
  switch (state) {
    // case "00": {
    //   message = `${msgFrameString}Command Success`;
    //   break;
    // }
    case "01": {
      message = `${msgFrameString}Command Failure`;
      break;
    }
    case "02": {
      message = `${msgFrameString}Invalid Frame Format`;
      break;
    }
    case "03": {
      message = `${msgFrameString}Checksum Failure`;
      break;
    }
    case "04": {
      message = `Invalid Command ID`;
      break;
    }
    case "05": {
      message = `${msgFrameString}Access Denied by Device(Due to Internal Error)`;
      break;
    }
    case "06": {
      message = `${msgFrameString}Data Content Invalid`;
      break;
    }
    case "07": {
      message = `${msgFrameString}Database Error`;
      break;
    }
    case "08": {
      message = `Manual Operation Not Permitted in Auto Mode`;
      break;
    }
  }
  return message;
};
export const handle_FA03_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let state = payload.slice(2, 4);
    console.log("state", state);
    console.log("state", typeof state);
    //! get doc from DB using that mac if not exist then do nothing
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });

    if (device) {
      let { name } = device;
      let erroMessage = GET_ERROR_MESSAGE(
        ` ${name}: Configuration property `,
        state
      );
      console.log("answer", erroMessage);
      if (erroMessage) {
        console.log("inside");
        var webSocketTopic = process.env.CLOUD_TO_WS;
        console.log("topic", webSocketTopic);
        mqttClient.publish(webSocketTopic, erroMessage);
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
    console.log("state", typeof state);
    //! get doc from DB using that mac if not exist then do nothing
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });

    if (device) {
      let { name } = device;
      let erroMessage = GET_ERROR_MESSAGE(
        ` ${name}: Schedular property	 `,
        state
      );
      console.log("answer", erroMessage);
      if (erroMessage) {
        var webSocketTopic = process.env.CLOUD_TO_WS;
        console.log("topic", webSocketTopic);
        mqttClient.publish(webSocketTopic, erroMessage);
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
    console.log("state", typeof state);
    //! get doc from DB using that mac if not exist then do nothing
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });
    if (device) {
      let { name } = device;
      let erroMessage = GET_ERROR_MESSAGE(` ${name}: Operation Mode `, state);
      console.log("answer", erroMessage);
      if (erroMessage) {
        var webSocketTopic = process.env.CLOUD_TO_WS;
        console.log("topic", webSocketTopic);
        mqttClient.publish(webSocketTopic, erroMessage);
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
    console.log("state", typeof state);
    //! get doc from DB using that mac if not exist then do nothing
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });

    if (device) {
      let { name } = device;
      let erroMessage = GET_ERROR_MESSAGE(
        ` ${name}: Manual On/Off Operation `,
        state
      );
      console.log("answer", erroMessage);
      if (erroMessage) {
        var webSocketTopic = process.env.CLOUD_TO_WS;
        console.log("topic", webSocketTopic);
        mqttClient.publish(webSocketTopic, erroMessage);
      }
      //   if (state === "00") {
      //     const FA08payload = createFA08payload(
      //       device.pumpCurrentstate,
      //       device.pumpDuration
      //     );
      //     var PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(
      //       REPLACE_DELIMETER,
      //       device.pmac
      //     );
      //     mqttClient.publish(
      //       PUMP_TOPIC,
      //       FA08payload,
      //       { qos: 2 },
      //       (err, result) => {
      //         console.log(err);
      //         console.log(result);
      //       }
      //     );
      //   }
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
    console.log("state", typeof state);
    //! get doc from DB using that mac if not exist then do nothing
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });

    if (device) {
      let { name } = device;
      let erroMessage = GET_ERROR_MESSAGE(` ${name}: Firmware Upgrade `, state);
      console.log("answer", erroMessage);
      if (erroMessage) {
        var webSocketTopic = process.env.CLOUD_TO_WS;
        console.log("topic", webSocketTopic);
        mqttClient.publish(webSocketTopic, erroMessage);
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
export const handle_FA10_Response = async (macId, msgId, payload) => {
  try {
    console.log("Inside FA10 response");
    // const recievedMACId = macId;
    // let state = payload.slice(2, 4);
    // console.log("state", state);
    // console.log("state", typeof state);
    // //! get doc from DB using that mac if not exist then do nothing
    // let device = await Devices.findOneDocument({
    //   $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    // });
    mailAlerts("615edffc321f51002b4bcd43", "abc");
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
export const handle_EA01_Response = async (macId, msgId, payload) => {
  try {
    console.log("Inside handle_EA01_Response response");
    const recievedMACId = macId;
    let state = payload.slice(2);
    console.log("state", state);
    console.log("state", typeof state);
    let alertHisotyData = {};
    let alertMessage = await getAlertMessage(state);
    alertHisotyData = {
      alertName: alertMessage,
    };
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });
    let { _id, pmac, vmac } = device;
    if (recievedMACId === pmac) {
      alertHisotyData = {
        ...alertHisotyData,
        errorFrom: "Pump",
        deviceId: _id,
      };
    } else if (recievedMACId === vmac) {
      alertHisotyData = {
        ...alertHisotyData,
        errorFrom: "Valve",
        deviceId: _id,
      };
    }
    alertHisotyData = {
      ...alertHisotyData,
      Date: moment.tz(moment().format(), "Asia/calcutta").format("YYYY-MM-DD"),
      time: moment.tz(moment().format(), "Asia/calcutta").format("hh:mm:ss"),
    };
    console.log("alertHistoryData", alertHisotyData);
    await AlertsHistory.createData(alertHisotyData);
    mailAlerts(_id, alertMessage);
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
export const getAlertMessage = async (errorId) => {
  try {
    let alertMessage;
    console.log("ErrorId", errorId);
    switch (errorId) {
      case "01": {
        alertMessage = `Negative flow error`;
        break;
      }
      case "02": {
        alertMessage = `Modbus error`;
        break;
      }
      case "04": {
        alertMessage = `External RTC failure`;
        break;
      }
      case "08": {
        alertMessage = `Valve ON , No flow detected error`;
        break;
      }
    }
    return alertMessage;
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!", error);
  }
};
export const mailAlerts = async (id, alerts) => {
  try {
    console.log("Inside mailAlerts");
    let alertRecord = await Alerts.findData({
      deviceId: mongoose.Types.ObjectId(id),
      alertName: alerts,
    });
    console.log("Alert Record  length", alertRecord.length);
    if (alertRecord && alertRecord.length > 0) {
      console.log("Alert Record", alertRecord);
      for (let i = 0; i < alertRecord.length; i++) {
        let transporter = nodemailer.createTransport({
          service: "gmail",
          port: 25,
          secure: true,
          auth: {
            user: "digi5technologies@gmail.com",
            pass: "osuvgltfiefskdcm",
          },
        });
        // moment.tz(moment().format(), "Asia/calcutta").format("YYYY/MM/DD hh:mm:ss")
        const output = `<h2>${alertRecord[i].description}.</h2>
        <h2>AlertType:${alerts}</h2>
        <h2>Site Name:${alertRecord[i].name}</h2>
         <h2>DateTime is: ${moment
           .tz(moment().format(), "Asia/calcutta")
           .format("YYYY/MM/DD hh:mm:ss")}</h2>  `;
        console.log("Recievers email address", alertRecord[i].receiverEmail);
        let mailOptions = {
          from: '"digi5technologies@gmail.com" <your@email.com>', // sender address
          to: alertRecord[i].receiverEmail, // list of receivers
          subject: alertRecord[i].subject, // Subject line
          text: "Hello world?", // plain text body
          html: output, // html body
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("error in sending", error);
          } else {
            // res.status(200).send("true");
            console.log("no error");
          }
          // console.log("Message sent: %s", info.messageId);
          // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        });
      }
      // } else {
      //   let transporter = nodemailer.createTransport({
      //     service: "gmail",
      //     port: 25,
      //     secure: true,
      //     auth: {
      //       user: "digi5technologies@gmail.com",
      //       pass: "osuvgltfiefskdcm",
      //     },
      //   });
      //   let deviceData = await Devices.findOneDocument({
      //     _id: mongoose.Types.ObjectId(id),
      //   });
      //   const output = `<h2>${alerts}.</h2> <h2>DateTime is ${new Date(
      //     moment().tz("Asia/calcutta").format("YYYY/MM/DD hh:mm:ss")
      //   )}</h2>  <h2>Site Name:${deviceData.name}</h2>`;
      //   let mailOptions = {
      //     from: '"digi5technologies@gmail.com" <your@email.com>', // sender address
      //     to: "prempanwala710@gmail.com", // list of receivers
      //     subject: "Alerts", // Subject line
      //     text: "Hello world?", // plain text body
      //     html: output, // html body
      //   };
      //   transporter.sendMail(mailOptions, (error, info) => {
      //     if (error) {
      //       console.log("error in sending", error);
      //     } else {
      //       // res.status(200).send("true");
      //       console.log("no error");
      //     }
      //     // console.log("Message sent: %s", info.messageId);
      //     // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      //   });
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
export const handle_FA0A_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let heap_total = payload.slice(2, 10);
    let heap_free = payload.slice(10, 18);
    let iram_total = payload.slice(18, 26);
    let iram_free = payload.slice(26, 34);
    let dram_total = payload.slice(34, 42);
    let dram_free = payload.slice(42, 50);
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });
    console.log("device", device);
    console.log("we1", freeMemoryData);
    if (device) {
      let { name } = device;
      let freeMemoryData = {
        name,
        Total_Heap: Number(heap_total / 1000) + "(kb)",
        Free_Heap: Number(heap_free / 1000) + "(kb)",
        Total_Iram: Number(iram_total / 1000) + "(kb)",
        Free_Iram: Number(iram_free / 1000) + "(kb)",
        Total_Dram: Number(dram_total / 1000) + "(kb)",
        Free_Dram: Number(dram_free / 1000) + "(kb)",
      };
      var webSocketTopic = process.env.CLOUD_TO_REQ_RES;
      console.log("we1", webSocketTopic);
      console.log("we1", freeMemoryData);
      mqttClient.publish(webSocketTopic, JSON.stringify(freeMemoryData));
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

export const handle_FA0B_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let up_time = payload.slice(2) + " (hhhhhh:mm:ss)";
    // up_time = JSON.stringify(up_time);
    // up_time = up_time.replace(/\b0+/g, "") ;
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });
    console.log("device", device);
    if (device) {
      let { name } = device;
      let upTimeData = {
        name,
        UP_Time: up_time,
      };
      var webSocketTopic = process.env.CLOUD_TO_REQ_RES;
      mqttClient.publish(webSocketTopic, JSON.stringify(upTimeData));
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

export const handle_FA0C_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let IMEI_VALUE = payload.slice(2);
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });
    console.log("device", device);
    if (device) {
      let { name } = device;
      let ImeiData = {
        name,
        IMEI_VALUE,
      };
      var webSocketTopic = process.env.CLOUD_TO_REQ_RES;
      mqttClient.publish(webSocketTopic, JSON.stringify(ImeiData));
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
export const handle_FA0D_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let RSSI_VALUE = payload.slice(2);
    // RSSI_VALUE = RSSI_VALUE.replace(/\b0+/g, "");
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });
    console.log("device", device);
    if (device) {
      let { name } = device;
      let RssiData = {
        name,
        RSSI_VALUE,
      };
      var webSocketTopic = process.env.CLOUD_TO_REQ_RES;
      mqttClient.publish(webSocketTopic, JSON.stringify(RssiData));
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};

export const handle_FA0E_Response = async (macId, msgId, payload) => {
  try {
    const recievedMACId = macId;
    let Factory_Reset = payload.slice(2);
    let device = await Devices.findOneDocument({
      $or: [{ pmac: recievedMACId }, { vmac: recievedMACId }],
    });
    console.log("device", device);
    if (device) {
      let { name } = device;
      let FactoryResetData = {
        name,
        Factory_Reset:
          Factory_Reset === "00"
            ? "Factory Reset Success"
            : "Factory Reset Failure",
      };
      var webSocketTopic = process.env.CLOUD_TO_REQ_RES;
      mqttClient.publish(webSocketTopic, JSON.stringify(FactoryResetData));
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
