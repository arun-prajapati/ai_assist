import {
  BadRequestError,
  InternalServerError,
} from "../../../helpers/errors/custom-error";
import {
  //createResponse,
  handleResponse,
  //databaseparser,
} from "../../../helpers/utility";
//import * as DeviceSrv from "../../../services/system/device/device.service";
import { logger, level } from "../../../config/logger/logger";
import Devices from "../../../models/device.model";
import { publishScheduleMSG } from "../../../services/mqtt/hardwareResponse";
export const createDevice = async (req, res, next) => {
  logger.log(level.info, `✔ Controller createDevice()`);
  try {
    await Devices.createData(req.body);
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
    let bmsData = await Devices.findOneDocument({ _id: req.params.deviceId });
    let dataObject = { message: "Device fetched succesfully", data: bmsData };
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
    } = req.body;
    let updateDeviceObject = {
      name,
      location,
      operationMode,
      threshold,
      lineSize,
      pipeSize,
      startDate,
      endDate,
    };
    let updateDevice = await Devices.updateData(
      { _id: req.params.deviceId },
      updateDeviceObject
    );
    if (startDate && endDate) {
      publishScheduleMSG(updateDevice, startDate, endDate);
    }
    let dataObject = { message: "Device Updated succesfully" };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
