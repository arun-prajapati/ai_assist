import { scheduleJob } from "node-schedule";
import { logger, level } from "../config/logger/logger";
import moment from "moment";
var schedule = require("node-schedule-tz");
import Notifications from "../models/notification.model";
import Devices from "../models/device.model";
import deviceHistory from "../models/deviceHistory.model";
import * as DeviceSrv from "../services/device/device.service";
const JOB_TIME = "16 15 * * *";
const MIN = 15; // this minute ago data should be update
scheduleJob(JOB_TIME, async () => {
  try {
    logger.log(level.info, `>> Mail Service Run  at ${moment().format()}`);
    let notificationdata = await Notifications.findData();
    let siteId = [];
    for (let i = 0; i < notificationdata.length; i++) {
      siteId.push(notificationdata[i].siteId);
    }
    // let deviceData = await Devices.findData(
    //   {
    //     _id: { $in: ["6155ae92ceceeb0036c3fde5", "615edffc321f51002b4bcd43"] },
    //   },
    //   {}
    // );
    console.log("HIIII", siteId);
    logger.log(level.info, `>> PREM PANWALA at ${moment().format()}`);
  } catch (error) {
    logger.log(level.error, `>> Device state JOB error ${error}`);
  }

  logger.log(
    level.info,
    `>> Device state JOB executed successfully at ${moment().format()}`
  );
});
