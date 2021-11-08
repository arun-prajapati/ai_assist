import { logger, level } from "../config/logger/logger";
import { mqttClient } from "../config/mqtt/mqtt";
import { handleMQTTData } from "../services/mqtt/mqtt.service";

const ESPToCloudTopic = process.env.ESP_TO_CLOUD;
const FIRST_SEPARATOR = "/";
const SECOND_SEPARATOR = ":";
const MAC_ELEMENT_AT = 1;
const JOIN_BY = "";
const CHANNEL_PREFIX = "SensieTech";

mqttClient.on("connect", function (client) {
  logger.log(level.info, "✔ Broker connected successfully");
  // Subscribe hardware topic here
  console.log(">>client id", client);  
  mqttClient.subscribe(ESPToCloudTopic);
});

mqttClient.on("message", async function (topic, message) {
  let mqttData = message.toString(); // this is in string
  // mqttData = JSON.parse(mqttData); // this will parse above string and return object

  let macId = getMacId(topic);
  if (macId && macId.length === 12) {
    await handleMQTTData(macId, mqttData); // handle message data
  }
});

const getMacId = (topic) => {
  try {
    let topicDataArray = topic.split(FIRST_SEPARATOR);
    if (topicDataArray.includes(CHANNEL_PREFIX)) {
      let macIdWithColon = topicDataArray[MAC_ELEMENT_AT];
      let macId = macIdWithColon.split(SECOND_SEPARATOR).join(JOIN_BY);
      return macId;
    }
    return false;
  } catch (error) {
    logger.log(level.error, "❌ MQTT message data is not valid");
  }
  return false;
};
