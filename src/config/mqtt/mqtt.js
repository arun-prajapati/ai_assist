import mqtt from "mqtt";

const HOST = process.env.BROKER_HOST;
const PORT = process.env.MQTT_PORT;
const username = process.env.BROKER_USERNAME;
const password = process.env.BROKER_PASSWORD;

export const mqttClient = mqtt.connect(`mqtt://${HOST}:${PORT}`, {
  username,
  password,
});
