import moment from "moment-timezone";
import deviceHistory from "../../models/deviceHistory.model";
import { logger, level } from "../../config/logger/logger";
export const addDeviceHistoryData = async (deviceData) => {
  logger.log(level.info, "Services: addDeviceHistoryData");
 // deviceData = JSON.parse(JSON.stringify(deviceData));
  deviceData.date = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD:h:m:s"));
  deviceData.time = moment
    .tz(moment().format(), "Asia/calcutta")
    .format("hh:mm:ss");
  deviceData.deviceId = deviceData._id;
  delete deviceData._id;
  console.log(">>afterdate modified", deviceData.date);
  await deviceHistory.createData(deviceData);
};
