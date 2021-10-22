import { scheduleJob } from "node-schedule";
import { logger, level } from "../config/logger/logger";
import moment from "moment";
var schedule = require("node-schedule-tz");
import Notifications from "../models/notification.model";
import Devices from "../models/device.model";
import deviceHistory from "../models/deviceHistory.model";
import * as DeviceSrv from "../services/device/device.service";
const JOB_TIME = "43 19 * * *";
const mongoose = require("mongoose");
const MIN = 15; // this minute ago data should be update
scheduleJob(JOB_TIME, async () => {
  try {
    logger.log(level.info, `>> Mail Service Run  at ${moment().format()}`);
    let notificationdata = await Notifications.findData();

    for (let i = 0; i < 1; i++) {
      let siteId = [];
      siteId = siteId.concat(notificationdata[i].siteId);
      let deviceData = await Devices.findData(
        {
          _id: { $in: siteId },
        },
        { totaliser_current_value: 1 }
      );
      var dates = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      dates.setDate(dates.getDate() - 1);
      console.log(">>===", dates);
      let historyData = await deviceHistory.aggregate([
        {
          $addFields: {
            date_timezone: {
              $dateToParts: { date: "$date" },
            },
          },
        },
        {
          $match: {
            // deviceId: { $in: siteId },
            date: {
              $gte: new Date(new Date(dates)),
              $lte: new Date(new Date(dates)).setHours(23, 59, 59),
            },
          },
        },
        {
          $group: {
            _id: "$deviceId",
            totaliser: { $push: "$$ROOT" },
          },
        },
        // {
        //   $match: {
        //     _id: {
        //       $in: ["61656910d03729002ce7b0e5", "615eeb21b21ffd002a6cfd47"],
        //     },
        //   },
        // },
        // {
        //   $project: {
        //     date: { $last: "$totaliser.totaliser_current_value" },
        //   },
        // },
        // { $sort: { date: -1 } },
      ]);
      console.log("HIIII", siteId);
      console.log("HIIII1", deviceData);
      console.log("HIIII2", historyData);
    }

    logger.log(level.info, `>> PREM PANWALA at ${moment().format()}`);
  } catch (error) {
    logger.log(level.error, `>> Device state JOB error ${error}`);
  }

  logger.log(
    level.info,
    `>> Device state JOB executed successfully at ${moment().format()}`
  );
});
