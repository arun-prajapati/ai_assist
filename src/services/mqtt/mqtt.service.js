import { CONSTANTS as MESSAGE } from "../../constants/messages/messageId";
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
  let { msgId, payload } = extractDataOBJ(data);
  switch (msgId) {
    case MESSAGE.FA01: {
      HR.DEVICE_CONNECTION(macId, msgId, payload);
      break;
    }
  }
};

//! split payload using AAAA
//! take [1] element and extract First 4 character which will give something like this FA01
//! now we got msgId so for particullar msgId we will create function
//! this functions will based on msgId extract values from payload
