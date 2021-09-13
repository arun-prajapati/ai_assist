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
export const deviceCount = async (req, res, next) => {
  logger.log(level.info, `✔ Controller deviceCount()`);
  try {
    let filter = [
      {
        $group: {
          _id: { pstate: "$pstate", vstate: "$vstate" },
          Devicecount: { $sum: 1 },
        },
      },
    ];
    let deviceCountData = await Devices.aggregate(filter);
    let deviceCountObject = { Unconfigured: 0, Online: 0, Offline: 0 };
    for (let i = 0; i < deviceCountData.length; i++) {
      if (
        deviceCountData[i]["_id"]["pstate"] === 0 ||
        deviceCountData[i]["_id"]["vstate"] === 0
      ) {
        deviceCountObject.Unconfigured++;
      } else if (
        deviceCountData[i]["_id"]["pstate"] === 1 &&
        deviceCountData[i]["_id"]["vstate"] === 1
      ) {
        deviceCountObject.Online++;
      } else if (
        deviceCountData[i]["_id"]["pstate"] === 2 ||
        deviceCountData[i]["_id"]["vstate"] === 2
      ) {
        deviceCountObject.Offline++;
      }
    }
    console.log(deviceCountObject);
    deviceCountObject["Total"] =
      parseInt(deviceCountObject["Unconfigured"]) +
      parseInt(deviceCountObject["Online"]) +
      parseInt(deviceCountObject["Offline"]);
    let dataObject = {
      message: "Device count fetched succesfully",
      data: deviceCountObject,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
