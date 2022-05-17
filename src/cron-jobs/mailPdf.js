import { scheduleJob } from "node-schedule";
import { logger, level } from "../config/logger/logger";
import moment from "moment";
import nodemailer from "nodemailer";
import Notifications from "../models/notification.model";
import Devices from "../models/device.model";
import deviceHistory from "../models/deviceHistory.model";
import * as DeviceSrv from "../services/device/device.service";
const JOB_TIME = "* * * * *";
const mongoose = require("mongoose");
const CsvParser = require("json2csv").Parser;
const MIN = 15; // this minute ago data should be update
scheduleJob(JOB_TIME, async () => {
  try {
    logger.log(level.info, `>> Mail Service Run  at ${moment().format()}`);
    let notificationdata = await Notifications.findData();
    for (let i = 0; i < notificationdata.length; i++) {
      let siteId = [];
      siteId = siteId.concat(notificationdata[i].siteId);
      let deviceData = await Devices.aggregate([
        {
          $match: {
            _id: { $in: siteId },
          },
        },
        {
          $project: {
            totaliser_current_value: 1,
            name: 1,
            threshold: 1,
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
      ]);
      var datesp = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      let deviceData1 = await deviceHistory.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(new Date(datesp)),
              $lte: new Date(new Date(datesp).setHours(23, 59, 59)),
            },
            pumpCurrentstate: true,
            valveCurrentstate: true,
          },
        },
        { $sort: { date: 1 } },
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
            date: { $first: "$totaliser.date" },
            time: { $first: "$totaliser.time" },
            name: { $first: "$totaliser.name" },
          },
        },
        { $sort: { _id: -1 } },
      ]);
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
            name: 1,
          },
        },
        { $sort: { _id: -1 } },
        // { $sort: { date: -1 } },
      ]);
      console.log("deviceData ", deviceData);
      console.log("deviedata1", deviceData1);
      console.log("historyData ", historyData);
      // console.log("siteId", siteId);
      for (let i = 0; i < deviceData1.length; i++) {
        deviceData1[i]._id = deviceData1[i]._id.toString();
      }
      for (let i = 0; i < deviceData.length; i++) {
        deviceData[i]._id = deviceData[i]._id.toString();
      }
      for (let i = 0; i < historyData.length; i++) {
        historyData[i]._id = historyData[i]._id.toString();
      }

      let demo = [];
      let demo1 = [];
      for (let i = 0; i < historyData.length; i++) {
        demo.push(historyData[i]._id);
      }
      for (let i = 0; i < deviceData1.length; i++) {
        demo1.push(deviceData1[i]._id);
      }
      let notIncludedInHistoryDataArray = [];
      let notIncludedInHistoryDataArray1 = [];
      for (let i = 0; i < deviceData.length; i++) {
        if (!demo.includes(deviceData[i]._id)) {
          let dummyDataObject = {
            _id: deviceData[i]._id,
            date: 0,
          };
          notIncludedInHistoryDataArray.push(dummyDataObject);
        }
      }
      for (let i = 0; i < deviceData.length; i++) {
        if (!demo1.includes(deviceData[i]._id)) {
          let dummyDataObject = {
            _id: deviceData[i]._id,
            date: "NA",
            time: "NA",
          };
          notIncludedInHistoryDataArray1.push(dummyDataObject);
        }
      }
      console.log("not include", notIncludedInHistoryDataArray);
      for (let i = 0; i < notIncludedInHistoryDataArray.length; i++) {
        historyData.push(notIncludedInHistoryDataArray[i]);
      }
      for (let i = 0; i < notIncludedInHistoryDataArray1.length; i++) {
        deviceData1.push(notIncludedInHistoryDataArray1[i]);
      }
      console.log("after add deviceData ", deviceData);
      console.log("after add deviedata1", deviceData1);
      console.log("after add historyData ", historyData);
      //Below Function Will short history array once again as dummy data are added and
      //it is not gurantee that they are already shorted so we are shorting once again
      historyData = historyData.sort(function (a, b) {
        return b._id.localeCompare(a._id);
      });
      deviceData1 = deviceData1.sort(function (a, b) {
        return b._id.localeCompare(a._id);
      });
      console.log("final device data", deviceData);
      console.log("final device  data1", deviceData1);
      console.log("final device history data", historyData);

      let data = [];

      for (let k = 0; k < deviceData.length; k++) {
        let datas = historyData.find((x) => {
          return x._id === deviceData[k]._id;
        });
        console.log("Comparsion", k, deviceData1.length - 1);
        let historyDataObject = {
          SiteName: deviceData[k].name,
          totaliser_current_value:
            Number(deviceData[k].totaliser_current_value) - Number(datas.date) <
            0
              ? "NA"
              : Number(deviceData[k].totaliser_current_value) -
                Number(datas.date),
          Threshold: deviceData[k].threshold,
          Date: deviceData1[k].date,
          Time: deviceData1[k].time,
        };
        data.push(historyDataObject);
      }
      console.log("datass", data);
      const csvFields = [
        "SiteName",
        "totaliser_current_value",
        "Threshold",
        "Date",
        "Time",
      ];
      const csvParser = new CsvParser({ csvFields });
      const csvData = csvParser.parse(data);
      let transporter = nodemailer.createTransport({
        service: "gmail",
        port: 25,
        secure: true,
        auth: {
          user: "sensietech12@gmail.com",
          pass: "xhyyfztrknrptrfi",
        },
      });

      let mailOptions = {
        from: '"sensietech12@gmail.com" <your@email.com>', // sender address
        to: `${notificationdata[i].receiverEmail}`, // list of receivers
        subject: "Requested  Device History", // Subject line
        text: "Hello world?", // plain text body
        html: "Device History", // html body
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
