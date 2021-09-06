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
export const createDevice = async (req, res, next) => {
  logger.log(level.info, `✔ Controller createDevice()`);
  try {
    let createDeviceObject = {
      name: req.body.name,
      pmac: req.body.pmac,
      vmac: req.body.vmac,
      location: req.body.location,
      pstate: req.body.pstate,
      vstate: req.body.vstate,
      operationMode: req.body.operationMode,
      threshold: req.body.threshold,
      lineSize: req.body.lineSize,
      pipeSize: req.body.pipeSize,
      typeOfSchedule: req.body.typeOfSchedule,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      pumpCurrentstate: req.body.pumpCurrentstate,
      pumpLastUpdated: new Date(req.body.pumpLastUpdated),
      valveCurrentstate: req.body.valveCurrentstate,
      valveLastUpdated: new Date(req.body.valveLastUpdated),
    };
    await Devices.createData(createDeviceObject);
    let dataObject = { message: "Device created succesfully" };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
