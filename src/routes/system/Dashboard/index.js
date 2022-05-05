import { Router } from "express";
import * as DashboardCtrl from "../../../controller/system/Dashboard/dashboard.controller";
// import * as ErrorMiddleware from "../../../middleware/validatorError";
// import { validate as DeviceValidate } from "../../../validator/system/device/device.validator";
// import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
  DEVICECOUNTS: "/deviceCount",
  STATS: "/stats",
};
routes.route(PATH.DEVICECOUNTS).get(AuthMiddleware, DashboardCtrl.deviceCount);
routes
  .route(PATH.STATS)
  // .get(/*AuthMiddleware,*/ DashboardCtrl.graphData)
  .post(DashboardCtrl.mailDeviceGraphData);

export default routes;
