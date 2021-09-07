import { Router } from "express";
import * as DashboardCtrl from "../../../controller/system/Dashboard/dashboard.controller";
// import * as ErrorMiddleware from "../../../middleware/validatorError";
// import { validate as DeviceValidate } from "../../../validator/system/device/device.validator";
// import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
// import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
  DEVICECOUNTS: "/deviceCount",
};
routes.route(PATH.DEVICECOUNTS).get(DashboardCtrl.deviceCount);

export default routes;
