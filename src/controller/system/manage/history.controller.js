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
export const getDeviceHistoryData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: getDeviceHistoryData()`);
  try {
    let historyData = await deviceHistory.findData({
      //_id: req.query.deviceId,
      createdAt: {
        $gte: new Date(new Date(req.body.startDate).setHours(0, 0, 0)),
        $lte: new Date(new Date(req.body.endDate).setHours(23, 59, 59)),
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
