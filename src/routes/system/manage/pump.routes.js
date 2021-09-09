import { Router } from "express";
import * as PumpCtrl from "../../../controller/manage/pump.controller";
import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
import * as ErrorMiddleware from "../../../middleware/validatorError";
import { validate as DeviceValidate } from "../../../validator/device/device.validator";
const routes = new Router();

const PATH = {
  ROOT: "/",
  OPERATION: "/operation",
};

routes
  .route(PATH.OPERATION)
  .put(
    [
      DeviceValidate(SYSTEM_CONSTANTS.OPERATE_PUMP),
      ErrorMiddleware.ExpressValidatorError,
    ],
    PumpCtrl.operatePump
  );

export default routes;
