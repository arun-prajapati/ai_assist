import { Router } from "express";
import * as DeviceHistoryCtrl from "../../../controller/system/manage/history.controller";
import * as DeviceAlertCtrl from "../../../controller/system/manage/alert.contoller";
import * as DeviceNotificationCtrl from "../../../controller/system/manage/notification.controller";
import PumpRoutes from "./pump.routes";
import multer from "multer";
import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();

const PATH = {
  ROOT: "/",
  DEVICE_HISTORY: "/history",
  DOWNLOAD_DEVICE_HISTORY: "/download/history",
  PUMP: "/pump",
  FIRMWARE_VERSION: "/firmwareVersion",
  UPLOAD_FIRMWARE: "/uploadFirmware",
  ALERT: "/alert",
  ALERT_BY_ID: "/alert/:id",
  NOTIFICATION: "/notification",
};
const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});
const upload = multer({ storage }).single("file");

routes
  .route(PATH.DEVICE_HISTORY)
  .post(AuthMiddleware, DeviceHistoryCtrl.getDeviceHistoryData);

routes
  .route(PATH.DOWNLOAD_DEVICE_HISTORY)
  .get(DeviceHistoryCtrl.downloadDeviceHistoryData)
  .post(DeviceHistoryCtrl.mailDeviceHistoryData);
routes
  .route(PATH.FIRMWARE_VERSION)
  .post(AuthMiddleware, DeviceHistoryCtrl.firmwareVersion)
  .get(AuthMiddleware, DeviceHistoryCtrl.listFirmwareVersions)
  .delete(DeviceHistoryCtrl.deleteFirmwareVersions);
routes
  .route(PATH.UPLOAD_FIRMWARE)
  .post(AuthMiddleware, upload, DeviceHistoryCtrl.uploadFirmwareVersion);
routes
  .route(PATH.NOTIFICATION)
  .post(DeviceNotificationCtrl.addNotificationData);
routes
  .route(PATH.ALERT)
  .post(DeviceAlertCtrl.addAlertconfigurationData)
  .get(DeviceAlertCtrl.getAlertconfigurationData)
  .patch(DeviceAlertCtrl.updateAlertconfigurationData)
  .delete(DeviceAlertCtrl.deleteAlertconfigurationData);
routes
  .route(PATH.ALERT_BY_ID)
  .get(DeviceAlertCtrl.getSingleAlertconfigurationData);
routes.use(PATH.PUMP, PumpRoutes);

export default routes;
