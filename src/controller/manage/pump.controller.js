import moment from "moment";
import {
  BadRequestError,
  InternalServerError,
} from "../../helpers/errors/custom-error";
import { getMINPadvalue, handleResponse } from "../../helpers/utility";
import { logger, level } from "../../config/logger/logger";
import {
  publishPumpOperation,
  publishPumpOperationType,
} from "../../services/mqtt/hardwareResponse";
import Devices from "../../models/device.model";
import * as DeviceSrv from "../../services/device/device.service";
// import { publishPumpOperation } from "../../services/mqtt/hardwareResponse";

//! add validation for checking existance of pump
export const operatePump = async (req, res, next) => {
  logger.log(level.info, `>> Controller: operatePump()`);
  try {
    let { pmac, operation, min, operationMode } = req.body;
    let updateFields = {};
    let message;
    if (operationMode && pmac) {
      let deviceDoc = await Devices.findOneDocument({
        pmac,
      });
      let { vmac } = deviceDoc;
      await publishPumpOperationType(pmac, vmac, operationMode);
      if (operationMode === "auto") {
        updateFields = {
          pumpLastUpdated: moment().format(),
          operationMode: "auto",
        };
      } else {
        updateFields = {
          pumpLastUpdated: moment().format(),
          operationMode: "manual",
        };
      }
      message =
        operationMode === "auto"
          ? "Pump is set to auto mode"
          : "Pump is set to manual mode";
    } else {
      if (min) min = getMINPadvalue(min);
      if (operation === true || operation === "true") operation = true;
      if (operation === false || operation === "false") operation = false;
      let deviceDoc = await Devices.findOneDocument({
        pmac,
      });
      let { vmac } = deviceDoc;
      await publishPumpOperation(pmac, vmac, operation, min);
      if (operation || operation === "true") {
        updateFields = {
          pstate: 1,
          pumpCurrentstate: true,
          pumpLastUpdated: moment().format(),
          operationMode: "manual",
        };
      } else {
        updateFields = {
          pumpCurrentstate: false,
          pumpLastUpdated: moment().format(),
          operationMode: "auto",
        };
      }
      console.log(">>>>", operation);
      message = operation ? "Pump is started" : "Pump is stopped";
    }
    let updateDeviceData = await Devices.updateData(
      {
        pmac,
      },
      updateFields
    );
    await DeviceSrv.addDeviceHistoryData(updateDeviceData);

    let dataObject = { message };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
