import { Router } from "express";
import * as DeviceHistoryCtrl from "../../../controller/system/manage/history.controller";
import PumpRoutes from "./pump.routes";

const routes = new Router();

const PATH = {
  ROOT: "/",
  DEVICE_HISTORY: "/history",
  PUMP: "/pump",
  FIRMWARE_VERSION: "/firmwareVersion",
};
routes.route(PATH.DEVICE_HISTORY).post(DeviceHistoryCtrl.getDeviceHistoryData);
routes.route(PATH.FIRMWARE_VERSION).post(DeviceHistoryCtrl.firmwareVersion);

routes.use(PATH.PUMP, PumpRoutes);

export default routes;
