import moment from "moment";
import {
  BadRequestError,
  InternalServerError,
} from "../../helpers/errors/custom-error";
import { getMINPadvalue, handleResponse } from "../../helpers/utility";
import { logger, level } from "../../config/logger/logger";
import { publishPumpOperation } from "../../services/mqtt/hardwareResponse";
import Devices from "../../models/device.model";

// import { publishPumpOperation } from "../../services/mqtt/hardwareResponse";

//! add validation for checking existance of pump
export const operatePump = async (req, res, next) => {
  logger.log(level.info, `>> Controller: operatePump()`);
  try {
    let { pmac, operation, min } = req.body;
    if (min) min = getMINPadvalue(min);

    if (operation === true || operation === "true") operation = true;
    if (operation === false || operation === "false") operation = false;

    let deviceDoc = await Devices.findOneDocument({
      pmac,
    });

    let { vmac } = deviceDoc;
    await publishPumpOperation(pmac,vmac, operation, min);
    let updateFields = {};
    if (operation || operation === "true") {
      updateFields = {
        pstate: 1,
        pumpCurrentstate: true,
        pumpLastUpdated: moment().format(),
      };
    } else {
      updateFields = {
        pumpCurrentstate: false,
        pumpLastUpdated: moment().format(),
      };
    }

    await Devices.updateData(
      {
        pmac,
      },
      updateFields
    );

    let message = operation ? "Pump is started" : "Pump is stopped";
    let dataObject = { message };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
