import {
  BadRequestError,
  InternalServerError,
} from "../../../helpers/errors/custom-error";
import moment from "moment";
import {
  //createResponse,
  handleResponse,
  //databaseparser,
  flowCoversion,
} from "../../../helpers/utility";
import * as DeviceSrv from "../../../services/device/device.service";
import { logger, level } from "../../../config/logger/logger";
import Devices from "../../../models/device.model";
import deviceHistory from "../../../models/deviceHistory.model";
import {
  getHHMMSS,
  publishScheduleMSG,
} from "../../../services/mqtt/hardwareResponse";
const mongoose = require("mongoose");

export const createDevice = async (req, res, next) => {
  logger.log(level.info, `✔ Controller createDevice()`);
  let body = req.body;
  try {
    if (body.startTime || body.endTime) {
      body.startTime = body.startTime ? getHHMMSS(body.startTime) : undefined;
      body.endTime = body.endTime ? getHHMMSS(body.endTime) : undefined;
    }
    let deviceData = await Devices.createData(body);
    await DeviceSrv.addDeviceHistoryData(deviceData);
    let dataObject = { message: "Device created succesfully" };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const getDevices = async (req, res, next) => {
  logger.log(level.info, `✔ Controller getDevices()`);
  try {
    let deviceData = await Devices.findData();
    let dataObject = {
      message: "Devices fetched succesfully",
      count: deviceData.length,
      data: deviceData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const getSingleDevice = async (req, res, next) => {
  logger.log(level.info, `✔ Controller getSingleDevice()`);
  try {
    let deviceData = await Devices.findOneDocument({
      _id: req.params.deviceId,
    });
    var dates = new Date(moment().tz("Asia/calcutta").format());
    //dates.setDate(dates.getDate()-1);

    let historyData = await deviceHistory.findData(
      {
        deviceId: mongoose.Types.ObjectId(deviceData._id),
        date: {
          $gte: new Date(new Date(dates).setHours(0, 0, 0)),
          $lte: new Date(new Date(dates).setHours(23, 59, 59)),
        },
      },
      { createdAt: 0 },
      { sort: { date: -1 }, limit: 1 }
    );
    let totaliserValue = 0,
      tankCapacity = 0,
      tankValue = 0,
      estimatedTimeValue = 0;
    console.log("historydatalength", historyData.length);
    console.log("deviceData.threshold", deviceData.threshold);
    if (historyData && historyData.length > 0) {
      flowCoversion(deviceData.flowValue, deviceData.flowUnit);
      totaliserValue =
        deviceData.totaliser_current_value -
        historyData[0].totaliser_current_value;
      console.log("totaliserValue", totaliserValue);
      tankValue = Number(totaliserValue * 100.0) / Number(deviceData.threshold);
      tankCapacity = Number(deviceData.threshold) - Number(totaliserValue);
      console.log("tankCapacity", tankCapacity);
      if (tankCapacity > 0) {
        //deviceData.flowValue
        estimatedTimeValue = tankCapacity / 2.5;
        console.log("estimatedTimeValue", estimatedTimeValue);
      }
    }
    let deviceDataObject = {
      tankCapacity,
      tankValue,
      estimatedTimeValue,
      totaliserValue,
      name: deviceData.name,
      pmac: deviceData.pmac,
      vmac: deviceData.vmac,
      pstate: deviceData.pstate,
      vstate: deviceData.vstate,
      operationMode: deviceData.operationMode,
      threshold: deviceData.threshold,
      lineSize: deviceData.lineSize,
      pipeSize: deviceData.pipeSize,
      flowValue: deviceData.flowValue,
      flowUnit: deviceData.flowUnit,
      payloadInterval: deviceData.payloadInterval,
      pumpCurrentstate: deviceData.pumpCurrentstate,
      pumpLastUpdated: deviceData.pumpLastUpdated,
      valveCurrentstate: deviceData.valveCurrentstate,
      valveLastUpdated: deviceData.valveLastUpdated,
      startDate: deviceData.startDate,
      endDate: deviceData.endDate,
      startTime: deviceData.startTime,
      endTime: deviceData.endTime,
    };
    let dataObject = {
      message: "Device fetched succesfully",
      data: deviceDataObject,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const removeDevice = async (req, res, next) => {
  logger.log(level.info, `✔ Controller removeDevice()`);
  try {
    await Devices.deleteData({ _id: req.params.deviceId });
    let dataObject = { message: "Device deleted succesfully" };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const updateDevice = async (req, res, next) => {
  logger.log(level.info, `>> Controller: updateDevice()`);
  try {
    let {
      name,
      location,
      operationMode,
      threshold,
      lineSize,
      pipeSize,
      startDate,
      endDate,
      startTime,
      endTime,
      payloadInterval,
    } = req.body;
    let updateDeviceObject = {
      name,
      location,
      operationMode,
      threshold,
      lineSize,
      pipeSize,
    };

    let scheduleCondt =
      startDate || endDate || startTime || endTime || payloadInterval;

    if (scheduleCondt) {
      updateDeviceObject = {
        ...updateDeviceObject,
        startDate,
        endDate,
        startTime: startTime ? getHHMMSS(startTime) : undefined,
        endTime: endTime ? getHHMMSS(endTime) : undefined,
        payloadInterval,
      };
    }

    let updateDeviceData = await Devices.updateData(
      { _id: req.params.deviceId },
      updateDeviceObject
    );
    await DeviceSrv.addDeviceHistoryData(updateDeviceData);
    if (scheduleCondt) {
      publishScheduleMSG(updateDevice, startDate, endDate, startTime, endTime);
    }
    let dataObject = { message: "Device Updated succesfully" };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
