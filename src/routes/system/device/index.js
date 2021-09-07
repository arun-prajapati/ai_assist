import { Router } from "express";
import * as DeviceCtrl from "../../../controller/system/device/device.controller";
import * as ErrorMiddleware from "../../../middleware/validatorError";
import { validate as DeviceValidate } from "../../../validator/device/device.validator";
import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
//import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();

const PATH = {
  ROOT: "/",
  DEVICEID: "/:deviceId",
};

routes
  .route(PATH.ROOT)
  .post(
    [
      DeviceValidate(SYSTEM_CONSTANTS.CREATE_DEVICE),
      ErrorMiddleware.ExpressValidatorError,
    ],
    DeviceCtrl.createDevice
  )
  .get(DeviceCtrl.getDevices);

routes
  .route(PATH.DEVICEID)
  .get(
    [
      DeviceValidate(SYSTEM_CONSTANTS.GET_SINGLE_DEVICE),
      ErrorMiddleware.ExpressValidatorError,
    ],
    DeviceCtrl.getSingleDevice
  )
  .delete(
    [
      DeviceValidate(SYSTEM_CONSTANTS.REMOVE_SINGLE_DEVICE),
      ErrorMiddleware.ExpressValidatorError,
    ],
    DeviceCtrl.removeDevice
  )
  .patch(
    [
      DeviceValidate(SYSTEM_CONSTANTS.UPDATE_SINGLE_DEVICE),
      ErrorMiddleware.ExpressValidatorError,
    ],
    DeviceCtrl.updateDevice
  );

export default routes;
