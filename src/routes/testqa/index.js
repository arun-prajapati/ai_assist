import { Router } from "express";
import * as TestqaCtrl from "../../controller/testqa/testqa.controller";
// import * as ErrorMiddleware from "../../../middleware/validatorError";
// import { validate as DeviceValidate } from "../../../validator/system/device/device.validator";
// import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
// import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
};
routes.route(PATH.ROOT).post(TestqaCtrl.createTestresultqa);
export default routes;
