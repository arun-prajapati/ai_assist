import { Router } from "express";
import * as DeviceCtrl from "../../../controller/system/device/device.controller";
// import * as ErrorMiddleware from "../../../middleware/validatorError";
// import { validate as DeviceValidate } from "../../../validator/system/device/device.validator";
// import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
// import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
};
routes.route(PATH.ROOT).post(DeviceCtrl.createDevice);

export default routes;
