import { logger, level } from "../../config/logger/logger";
// import { mqttClient } from "../../config/mqtt/mqtt";

const REPLACE_DELIMETER = "*";
const CLOUD_TO_ESP_TOPIC = process.env.CLOUD_TO_ESP || "SensieTech/*/c2f";

export const DEVICE_CONNECTION = (macId, payload) => {
  logger.log(level.info, `data : ${payload}${macId}`); //!remove log
  // from macId get pump and valve id
  // when you get this publish FA03 and FA02
  //! make change: get mac data from DB: pmac,vmac set them: PUMP_MAC=pmac,VALVE_MAC=vmac
  let PUMP_MAC = macId;
  //! make change

  var PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, PUMP_MAC);

  console.log(PUMP_TOPIC);
  // mqttClient.publish(PUMP_TOPIC, faultObj);
};
