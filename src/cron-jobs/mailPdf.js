import { scheduleJob } from "node-schedule";
import { logger, level } from "../config/logger/logger";
import moment from "moment";
var schedule = require("node-schedule-tz");
import nodemailer from "nodemailer";
import Notifications from "../models/notification.model";
import Devices from "../models/device.model";
import deviceHistory from "../models/deviceHistory.model";
import * as DeviceSrv from "../services/device/device.service";
const JOB_TIME = "22 20 * * *";
const mongoose = require("mongoose");
const CsvParser = require("json2csv").Parser;
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
        { totaliser_current_value: 1, name: 1 }
      );
      var dates = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      dates.setDate(dates.getDate() - 1);
      console.log(">>===", new Date(new Date(dates)));
      console.log(">>===", new Date(new Date(dates).setHours(23, 59, 59)));
      let historyData = await deviceHistory.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(new Date(dates)),
              $lte: new Date(new Date(dates).setHours(23, 59, 59)),
            },
          },
        },
        {
          $group: {
            _id: "$deviceId",
            totaliser: { $push: "$$ROOT" },
          },
        },
        {
          $match: {
            _id: { $in: siteId },
          },
        },
        {
          $project: {
            date: { $last: "$totaliser.totaliser_current_value" },
          },
        },
        // { $sort: { date: -1 } },
      ]);
      console.log("HIIII", siteId);
      console.log("HIIII1", deviceData);
      console.log("HIIII2", historyData);
      let data = [];
      for (let k = 0; k < deviceData.length; k++) {
        let historyDataObject = {
          SiteName: deviceData[k].name,
          totaliser_current_value:
            Number(deviceData[k].totaliser_current_value) -
            Number(historyData[k].date),
        };
        data.push(historyDataObject);
      }
      const csvFields = ["SiteName", "totaliser_current_value"];
      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(data);
      let transporter = nodemailer.createTransport({
        service: "gmail",
        port: 25,
        secure: true,
        auth: {
          user: "digi5technologies@gmail.com",
          pass: "osuvgltfiefskdcm",
        },
      });
      setTimeout(() => {
        let mailOptions = {
          from: '"digi5technologies@gmail.com" <your@email.com>', // sender address
          to: `${notificationdata[i].receiverEmail}`, // list of receivers
          subject: "Requested  Device History", // Subject line
          text: "Hello world?", // plain text body
          html: "ss", // html body
          attachments: [
            {
              filename: "History.csv",
              content: csvData,
            },
          ],
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("error in sending", error);
          } else {
            console.log("no error");
          }
        });
      }, 2000);
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
