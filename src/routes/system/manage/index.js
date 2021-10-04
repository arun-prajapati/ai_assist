import { Router } from "express";
import * as DeviceHistoryCtrl from "../../../controller/system/manage/history.controller";
import PumpRoutes from "./pump.routes";
import multer from "multer";
const routes = new Router();

const PATH = {
  ROOT: "/",
  DEVICE_HISTORY: "/history",
  DOWNLOAD_DEVICE_HISTORY: "/download/history",
  PUMP: "/pump",
  FIRMWARE_VERSION: "/firmwareVersion",
  UPLOAD_FIRMWARE: "/uploadFirmware",
};
const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});
const upload = multer({ storage }).single("file");

routes.route(PATH.DEVICE_HISTORY).post(DeviceHistoryCtrl.getDeviceHistoryData);

routes
  .route(PATH.DOWNLOAD_DEVICE_HISTORY)
  .get(DeviceHistoryCtrl.downloadDeviceHistoryData);
routes
  .route(PATH.FIRMWARE_VERSION)
  .post(DeviceHistoryCtrl.firmwareVersion)
  .get(DeviceHistoryCtrl.listFirmwareVersions);
routes
  .route(PATH.UPLOAD_FIRMWARE)
  .post(upload, DeviceHistoryCtrl.uploadFirmwareVersion);

routes.use(PATH.PUMP, PumpRoutes);

export default routes;
