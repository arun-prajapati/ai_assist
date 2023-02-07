import { Router } from "express";
import * as TestresultCtrl from "../../controller/testresult/testresult.controller";
// import * as ErrorMiddleware from "../../../middleware/validatorError";
// import { validate as DeviceValidate } from "../../../validator/system/device/device.validator";
// import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
// import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
  GET_TEST_RESULT:"/gettestresult",
  SINGLE_TEST_RESULT_OPERATION:"/testresultopertion/:testresultId"
};
routes.route(PATH.ROOT).post(TestresultCtrl.createTestresult);
routes.route(PATH.GET_TEST_RESULT).post(TestresultCtrl.getTestResult);
routes.route(PATH.SINGLE_TEST_RESULT_OPERATION).put(TestresultCtrl.updateTestresult);
export default routes;
