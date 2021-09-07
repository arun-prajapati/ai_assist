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
  .get(DeviceCtrl.getSingleDevice)
  .delete(DeviceCtrl.removeDevice)
  .patch(DeviceCtrl.updateDevice);

export default routes;
