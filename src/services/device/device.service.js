import deviceHistory from "../../models/deviceHistory.model";
import { logger, level } from "../../config/logger/logger";
export const addDeviceHistoryData = async (deviceData) => {
  logger.log(level.info, "Services: addDeviceHistoryData");
  deviceData = JSON.parse(JSON.stringify(deviceData));
  delete deviceData._id;
  await deviceHistory.createData(deviceData);
};
