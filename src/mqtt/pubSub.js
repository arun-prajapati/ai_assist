import { logger, level } from "../config/logger/logger";
import { mqttClient } from "../config/mqtt/mqtt";
// import { handleMQTTData } from "../services/mqtt/mqtt.service";

const ESPToCloudTopic = process.env.ESP_TO_CLOUD;

mqttClient.on("connect", function () {
  logger.log(level.info, "✔ Broker connected successfully");
  // Subscribe hardware topic here
  mqttClient.subscribe(ESPToCloudTopic);
});


// mqttClient.on("message", async function (topic, message) {
  // const isItBuffer = Buffer.isBuffer(message);
  // if (isItBuffer) {
  //   let mqttData = message.toString(); // this is in string
  //   if (isMessageFormatIsObject(mqttData)) {
  //     mqttData = JSON.parse(mqttData); // this will parse above string and return object
  //     // console.log("mqttData:", mqttData);
  //     await handleMQTTData(mqttData); // handle message data
  //   } else {
  //     logger.log(level.error, "❌ MQTT message data is not an object");
  //   }
  // }
// });

// let isMessageFormatIsObject = (mqttData) => {
//   try {
//     if (typeof JSON.parse(mqttData) === "object") return true;
//   } catch (error) {
//     return false;
//   }
// };
