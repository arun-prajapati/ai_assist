import {
  BadRequestError,
  InternalServerError,
} from "../../../helpers/errors/custom-error";
import {
  //createResponse,
  handleResponse,
  //databaseparser,
} from "../../../helpers/utility";
import { logger, level } from "../../../config/logger/logger";
import deviceHisroty from "../../../models/deviceHistory.model";
import deviceHistory from "../../../models/deviceHistory.model";
import moment from "moment";
export const getDeviceHistoryData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: getDeviceHistoryData()`);
  try {
    console.log(">>>", req.query.deviceId);
    let historyData = await deviceHistory.findData({
      deviceId: req.query.deviceId,
      date: {
        //moment.tz(start, "Asia/calcutta").format("DDMMYYYY")
        $gte: moment(req.body.startDate)
          .tz("Asia/calcutta")
          .format("DD/MM/YYYY HH:mm:ss"),
        $lte: moment(req.body.startDate)
          .tz("Asia/calcutta")
          .format("DD/MM/YYYY HH:mm:ss"),
      },
    });
    let dataObject = {
      message: "Device history fetched succesfully",
      count: historyData.length,
      data: historyData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
