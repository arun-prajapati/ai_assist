import { scheduleJob } from "node-schedule";
import { logger, level } from "../config/logger/logger";
import moment from "moment";
var schedule = require("node-schedule-tz");
import Devices from "../models/device.model";
import deviceHistory from "../models/deviceHistory.model";
import * as DeviceSrv from "../services/device/device.service";
const JOB_TIME = "07 20 * * *";
const MIN = 15; // this minute ago data should be update
schedule.scheduleJob(JOB_TIME, "Asia/calcutta", async () => {
  try {
    logger.log(level.info, `>> PREM PANWALA at ${moment().format()}`);
    let data = await Devices.findData();
    console.log("HIIII", data);
    logger.log(level.info, `>> PREM PANWALA at ${moment().format()}`);
  } catch (error) {
    logger.log(level.error, `>> Device state JOB error ${error}`);
  }

  logger.log(
    level.info,
    `>> Device state JOB executed successfully at ${moment().format()}`
  );
});
