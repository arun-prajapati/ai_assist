import { CONSTANTS as MESSAGE } from "../../constants/messages/messageId";
import { logger, level } from "../../config/logger/logger";
import * as HR from "./hardwareResponse";

const START_DELIMETER = "AAAA";
const END_DELIMETER = "5555";

const extractDataOBJ = (data) => {
  let splitByStartDelimeter = data.split(START_DELIMETER);
  let payloadWithoutStartDelimeter = splitByStartDelimeter[1];
  // let splitByEndDelimeter = payloadWithoutStartDelimeter.split(END_DELIMETER);
  let splitByEndDelimeter = payloadWithoutStartDelimeter.substring(
    0,
    payloadWithoutStartDelimeter.length - 4
  );
  console.log("split ", splitByEndDelimeter);
  let payloadWithoutDelimeters = splitByEndDelimeter;
  console.log("payloadWithoutDelimeters", payloadWithoutDelimeters);
  let extractMSGId = payloadWithoutStartDelimeter.slice(0, 4);
  let payloadWithoutMSGId = payloadWithoutDelimeters.split(extractMSGId);
  let payload = payloadWithoutMSGId[1];

  let dataObject = {
    msgId: extractMSGId,
    payload,
  };
  return dataObject;
};

export const handleMQTTData = async (macId, data) => {
  try {
    let { msgId, payload } = extractDataOBJ(data);
    logger.log(
      level.info,
      `data: ${JSON.stringify({ macId, msgId, payload })}`
    );

    switch (msgId) {
      case MESSAGE.FA01: {
        HR.DEVICE_CONNECTION(macId, msgId, payload);
        break;
      }

      case MESSAGE.FA02: {
        HR.firmwareVersions(macId, payload);
        break;
      }
      case MESSAGE.FA03: {
        HR.handle_FA03_Response(macId, msgId, payload);
        break;
      }
      case MESSAGE.FA04: {
        HR.handle_FA04_Response(macId, msgId, payload);
        break;
      }
      case MESSAGE.FA05: {
        HR.PUMP_STATUS(macId, payload);
        break;
      }

      case MESSAGE.FA06: {
        HR.VALVE_STATUS(macId, payload);
        break;
      }
      case MESSAGE.FA07: {
        HR.handle_FA07_Response(macId, msgId, payload);
        break;
      }
      case MESSAGE.FA08: {
        HR.handle_FA08_Response(macId, msgId, payload);
        break;
      }
      case MESSAGE.FA10: {
        HR.handle_FA10_Response(macId, msgId, payload);
        break;
      }
      case MESSAGE.FA0A: {
        HR.handle_FA0A_Response(macId, msgId, payload);
        break;
      }
      case MESSAGE.FA0B: {
        HR.handle_FA0B_Response(macId, msgId, payload);
        break;
      }
      case MESSAGE.FA0C: {
        HR.handle_FA0C_Response(macId, msgId, payload);
        break;
      }
      case MESSAGE.FA0D: {
        HR.handle_FA0D_Response(macId, msgId, payload);
        break;
      }
      case MESSAGE.FA0E: {
        HR.handle_FA0E_Response(macId, msgId, payload);
        break;
      }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
