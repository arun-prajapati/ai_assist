import {
  BadRequestError,
  InternalServerError,
} from "../../../helpers/errors/custom-error";
import moment from "moment";
import {
  //createResponse,
  handleResponse,
  //databaseparser,
} from "../../../helpers/utility";
import * as DeviceSrv from "../../../services/device/device.service";
import { logger, level } from "../../../config/logger/logger";
import Devices from "../../../models/device.model";
import deviceHistory from "../../../models/deviceHistory.model";
import {
  getHHMMSS,
  publishScheduleMSG,
} from "../../../services/mqtt/hardwareResponse";

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
    var dates = moment(new Date())
      .tz("Asia/calcutta")
      .format("DD/MM/YYYY HH:mm:ss");
    //dates.setDate(dates.getDate() - 1);
    let historyData = await deviceHistory.findData(
      {
        deviceId: deviceData._id,
        date: {
          $gte: dates,
          $lte: dates,
        },
      },
      { createdAt: 0 },
      { sort: { date: -1 }, limit: 1 }
    );
    let totaliserValue = 0,
      tankValue = 0,
      estimatedTimeValue = 0;
    if (
      historyData &&
      historyData.length > 0 &&
      deviceData.totaliser_current_value &&
      deviceData.flowValue
    ) {
      totaliserValue =
        historyData[0].totaliser_current_value -
        deviceData.totaliser_current_value;
      tankValue = (deviceData.threshold / totaliserValue) * 100;
      estimatedTimeValue =
        (deviceData.threshold - totaliserValue) / deviceData.flowValue;
    }
    let deviceDataObject = {
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
      flowValue: deviceData.pipeSize,
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
    console.log("deviceData", deviceData);
    console.log("deviceHistoryData", historyData);
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
      payloadInterval,
    };

    let scheduleCondt = startDate || endDate || startTime || endTime;

    if (scheduleCondt) {
      updateDeviceObject = {
        ...updateDeviceObject,
        startDate,
        endDate,
        startTime: startTime ? getHHMMSS(startTime) : undefined,
        endTime: endTime ? getHHMMSS(endTime) : undefined,
      };
    }

    let updateDeviceData = await Devices.updateData(
      { _id: req.params.deviceId },
      updateDeviceObject
    );
    await DeviceSrv.addDeviceHistoryData(updateDeviceData);
    if (scheduleCondt) {
      // publishScheduleMSG(updateDevice, startDate, endDate, startTime, endTime);
    }
    let dataObject = { message: "Device Updated succesfully" };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
