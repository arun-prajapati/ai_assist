import { CONSTANTS as MESSAGE } from "../../constants/messages/messageId";
import { logger, level } from "../../config/logger/logger";
import * as HR from "./hardwareResponse";

const START_DELIMETER = "AAAA";
const END_DELIMETER = "5555";

const extractDataOBJ = (data) => {
  let splitByStartDelimeter = data.split(START_DELIMETER);
  let payloadWithoutStartDelimeter = splitByStartDelimeter[1];
  let splitByEndDelimeter = payloadWithoutStartDelimeter.split(END_DELIMETER);
  let payloadWithoutDelimeters = splitByEndDelimeter[0];
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

      case MESSAGE.FA05: {
        HR.PUMP_STATUS(macId, payload);
        break;
      }

      // case MESSAGE.FA06: {
      //   HR.VALVE_STATUS(macId, payload);
      //   break;
      // }
    }
  } catch (error) {
    logger.log(level.info, "❌ Something went wrong!");
  }
};
