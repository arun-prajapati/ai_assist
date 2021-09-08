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
      { $sort: { count: -1 } },
    ];
    let deviceCountData = await Devices.aggregate(filter);
    let values = ["Unconfigured", "Online", "Offline"];
    let deviceCountObject = { Unconfigured: 0, Online: 0, Offline: 0 };
    deviceCountData.forEach((e) => {
      deviceCountObject[values[e._id.pstate]] = e.Devicecount;
    });
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
