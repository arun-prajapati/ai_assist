import { body, param } from "express-validator";
import { CONSTANTS as SYSTEM_CONSTANTS } from "../../constants/system/system";
import Devices from "../../models/device.model";
export const validate = (method) => {
  let error = [];
  switch (method) {
    case SYSTEM_CONSTANTS.CREATE_DEVICE: {
      error = [
        body("name", "Please enter name of Device").not().isEmpty(),
        body("pmac", "Please enter pump mac address")
          .not()
          .isEmpty()
          .custom(verifyPumpMacAddress),
        body("vmac", "Please enter valve mac address")
          .not()
          .isEmpty()
          .custom(verifyValveMacAddress),
        body("threshold", "Please enter thresold value").not().isEmpty(),
      ];
      break;
    }
    case SYSTEM_CONSTANTS.GET_SINGLE_DEVICE: {
      error = [param("deviceId").custom(deviceExist)];
      break;
    }
    case SYSTEM_CONSTANTS.REMOVE_SINGLE_DEVICE: {
      error = [param("deviceId").custom(deviceExist)];
      break;
    }
    case SYSTEM_CONSTANTS.UPDATE_SINGLE_DEVICE: {
      error = [param("deviceId").custom(deviceExist)];
      break;
    }
  }
  return error;
};

export const verifyPumpMacAddress = async (value) => {
  let pumpMacExist = await Devices.findOneDocument({ pmac: value });
  if (pumpMacExist) throw new Error("This pump mac already exist");
  return value;
};

export const verifyValveMacAddress = async (value) => {
  let valveMacExist = await Devices.findOneDocument({ vmac: value });
  if (valveMacExist) throw new Error("This valve mac already exist");
  return value;
};

export const deviceExist = async (value) => {
  let deviceExist = await Devices.findOneDocument({ _id: value });
  if (!deviceExist) throw new Error("This device does not exist");
  return value;
};
