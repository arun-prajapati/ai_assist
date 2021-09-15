import { Router } from "express";
import * as DeviceHistoryCtrl from "../../../controller/system/manage/history.controller";
import PumpRoutes from "./pump.routes";

const routes = new Router();

const PATH = {
  ROOT: "/",
  DEVICE_HISTORY: "/history",
  PUMP: "/pump",
};
routes.route(PATH.DEVICE_HISTORY).post(DeviceHistoryCtrl.getDeviceHistoryData);

routes.use(PATH.PUMP, PumpRoutes);

export default routes;
