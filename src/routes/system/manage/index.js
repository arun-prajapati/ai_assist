import { Router } from "express";
import * as DeviceHistoryCtrl from "../../../controller/system/manage/history.controller";
const routes = new Router();

const PATH = {
  ROOT: "/",
  DEVICE_HISTORY: "/history",
};
routes.route(PATH.DEVICE_HISTORY).get(DeviceHistoryCtrl.getDeviceHistoryData);
export default routes;
