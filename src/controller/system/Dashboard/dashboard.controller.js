import {
  BadRequestError,
  InternalServerError,
} from "../../../helpers/errors/custom-error";
import {
  //createResponse,
  handleResponse,
  //databaseparser,
} from "../../../helpers/utility";
import nodemailer from "nodemailer";
//import * as DeviceSrv from "../../../services/system/device/device.service";
import { logger, level } from "../../../config/logger/logger";
import Devices from "../../../models/device.model";
import deviceHistory from "../../../models/deviceHistory.model";
import { CONSTANTS as PERIOD_DATA } from "../../../constants/periodData";
import moment from "moment";
const mongoose = require("mongoose");

const defaultBatteryProperty = (period) => {
  let data = {
    _id: period,
    totaliser_current_value: 0,
  };
  return data;
};
const defaultBatteryPropertyOfWeek = (period) => {
  console.log(period);
  let demoDate = new Date(
    moment(period).tz("Asia/calcutta").format("YYYY-MM-DD")
  );
  let data = {
    _id: demoDate.getDate(),
    date: new Date(
      moment(period).tz("Asia/calcutta").format("YYYY-MM-DD")
    ).toISOString(),
    totaliser_current_value: 0,
  };
  return data;
};
export const deviceCount = async (req, res, next) => {
  logger.log(level.info, `✔ Controller deviceCount()`);
  try {
    let filter = [
      {
        $group: {
          _id: { pstate: "$pstate", vstate: "$vstate" },
          Devicecount: { $sum: 1 },
        },
      },
    ];
    let deviceCountData = await Devices.aggregate(filter);
    console.log(">>1st", deviceCountData);
    console.log(">>length", deviceCountData.length);
    //console.log(">>2nd", deviceCountData[1]["_id"]["pstate"]);
    let deviceCountObject = { Unconfigured: 0, Online: 0, Offline: 0 };
    for (let i = 0; i < deviceCountData.length; i++) {
      // console.log(">>Data", deviceCountData[i]["_id"]["pstate"]);
      //console.log(">>DeviceCOunt", deviceCountData[i]["Devicecount"]);
      if (
        deviceCountData[i]["_id"]["pstate"] === 0 ||
        deviceCountData[i]["_id"]["vstate"] === 0
      ) {
        deviceCountObject.Unconfigured =
          Number(deviceCountObject.Unconfigured) +
          Number(deviceCountData[i]["Devicecount"]);
      } else if (
        deviceCountData[i]["_id"]["pstate"] === 1 &&
        deviceCountData[i]["_id"]["vstate"] === 1
      ) {
        deviceCountObject.Online =
          Number(deviceCountObject.Online) +
          Number(deviceCountData[i]["Devicecount"]);
      } else if (
        deviceCountData[i]["_id"]["pstate"] === 2 ||
        deviceCountData[i]["_id"]["vstate"] === 2
      ) {
        deviceCountObject.Offline =
          Number(deviceCountObject.Offline) +
          Number(deviceCountData[i]["Devicecount"]);
      }
    }
    console.log(deviceCountObject);
    deviceCountObject["Total"] =
      parseInt(deviceCountObject["Unconfigured"]) +
      parseInt(deviceCountObject["Online"]) +
      parseInt(deviceCountObject["Offline"]);
    let dataObject = {
      message: "Device count fetched succesfully",
      data: deviceCountObject,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const graphData = async (req, res, next) => {
  logger.log(level.info, `✔ Controller graphData()`);
  let graphData = [];
  let dates = new Date(
    moment().tz("Asia/calcutta").format("YYYY/MM/DD hh:mm:ss")
  );
  let dateData = {
    yy: dates.getFullYear(),
    mm: dates.getMonth() + 1,
    dd: dates.getDate(),
  };
  console.log("dateData", dates);
  console.log("DASHBOARD GRAPH DATE", dateData);
  try {
    let pipeline;
    if (req.query.type === "day") {
      var dates1 = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      dates1.setDate(dates1.getDate() - 1);
      //dates.setHours(0, 0, 0);
      console.log(">>===", dates1);
      let historyData = await deviceHistory.findData(
        {
          deviceId: mongoose.Types.ObjectId(req.query.deviceId),
          date: {
            $gte: new Date(new Date(dates1)), //.toLocaleString("en-US", {
            //timeZone: "Asia/calcutta",
            //}),
            $lte: new Date(new Date(dates1)).setHours(23, 59, 59), //.toLocaleString(
            // "en-US",
            //{ timeZone: "Asia/calcutta" }
            //),
          },
        },
        { createdAt: 0 },
        { sort: { date: -1 }, limit: 2 }
      );
      console.log("historyData", historyData);

      // historyData[0].totaliser_current_value
      console.log("historyData", historyData.length);
      if (historyData && historyData.length > 0) {
        console.log(
          "historyData totalizer values",
          historyData[0].totaliser_current_value
        );
        pipeline = [
          {
            $addFields: {
              date_timezone: {
                $dateToParts: { date: "$date" },
              },
            },
          },
          {
            $match: {
              deviceId: mongoose.Types.ObjectId(req.query.deviceId),
              "date_timezone.year": dateData.yy,
              "date_timezone.month": dateData.mm,
              "date_timezone.day": dateData.dd,
            },
          },
          {
            $group: {
              _id: "$date_timezone.hour",
              totaliser: { $push: "$$ROOT" },
            },
          }, //totaliserValue: {
          //   $subtract: [
          //     "$totaliser.totaliser_current_value",
          //     historyData[0].totaliser_current_value,
          //   ],
          {
            $project: {
              totaliser_current_value: {
                $subtract: [
                  { $last: "$totaliser.totaliser_current_value" },
                  historyData[0].totaliser_current_value,
                ],
              },
            },
          },
          { $sort: { _id: 1 } },
        ];
        graphData = await deviceHistory.aggregate(pipeline);
        console.log("Hours graph Data", graphData);
        // graphData = JSON.parse(JSON.stringify(graphData));
        // let defaultgraphData = generateDefaultPropertiesOfHours(graphData);
        // let mergeArrayResponse = [...graphData, ...defaultgraphData];
        // graphData = sortResponsePeriodWise(mergeArrayResponse);
      } else {
        let deviceData = await Devices.findOneDocument({
          _id: mongoose.Types.ObjectId(req.query.deviceId),
        });
        console.log("deviceData", deviceData);
        let hours = new Date(
          moment(deviceData.updatedAt).tz("Asia/calcutta").format()
        );
        hours = JSON.stringify(hours);
        console.log("hours", hours.slice(12, 14));
        let demo = {
          ///new Date(moment(deviceData.updatedAt).tz("Asia/calcutta").format("YYYY-MM-DD"))
          _id: Number(hours.slice(12, 14)),
          totaliser_current_value: deviceData.totaliser_current_value,
        };

        console.log("demo", demo);
        graphData.push(demo);
        //graphData = [];
      }
      graphData = JSON.parse(JSON.stringify(graphData));
      console.log("Graph Data", graphData);
      let defaultgraphData = generateDefaultPropertiesOfHours(graphData);
      console.log("Default propeties BY hours", defaultgraphData);
      let mergeArrayResponse = [...graphData, ...defaultgraphData];
      graphData = sortResponsePeriodWiseByHours(mergeArrayResponse);
    } else if (req.query.type === "week") {
      var dates2 = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      dates2.setDate(dates2.getDate() - 1);
      var dates3 = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      dates3.setDate(dates3.getDate() - 8);
      console.log(
        "Week Date after -1",
        new Date(new Date(dates2).setHours(23, 59, 59))
      );
      console.log("Week Date after -8", dates3);
      pipeline = [
        {
          $addFields: {
            date_timezone: {
              $dateToParts: { date: "$date" },
            },
          },
        },
        {
          $match: {
            deviceId: mongoose.Types.ObjectId(req.query.deviceId),
            date: {
              $gte: new Date(new Date(dates3)),
              $lte: new Date(new Date(dates2).setHours(23, 59, 59)),
            },
          },
        },
        {
          $group: {
            _id: "$date_timezone.day",
            totaliser: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            date: { $first: "$totaliser.date" },
            totaliser_current_value: {
              $last: "$totaliser.totaliser_current_value",
            },
          },
        },
        { $sort: { date: -1 } },
      ];
      graphData = await deviceHistory.aggregate(pipeline);
      //graphData = JSON.parse(JSON.stringify(graphData));
      console.log("graph Data date ", graphData);
      let defaultgraphData = generateDefaultPropertiesOfWeek(graphData);
      console.log(" Default graph Data date ", defaultgraphData);
      let mergeArrayResponse = [...graphData, ...defaultgraphData];
      graphData = sortResponsePeriodWise(mergeArrayResponse);
      console.log("merger array", graphData);
      for (let i = 7; i > 0; i--) {
        if (
          graphData[i]["totaliser_current_value"] !== 0 &&
          graphData[i]["totaliser_current_value"] >=
            graphData[i - 1]["totaliser_current_value"]
        ) {
          graphData[i]["totaliser_current_value"] =
            graphData[i]["totaliser_current_value"] -
            graphData[i - 1]["totaliser_current_value"];
          console.log("i, i-1", i, i - 1);
          console.log(
            "SUbstraction",
            graphData[i]["totaliser_current_value"] -
              graphData[i - 1]["totaliser_current_value"]
          );
        }
      }
      console.log("lopp result", graphData);
    } else {
      pipeline = [
        {
          $addFields: {
            date_timezone: {
              $dateToParts: { date: "$date" },
            },
          },
        },
        {
          $match: {
            deviceId: mongoose.Types.ObjectId(req.query.deviceId),
            "date_timezone.year": dateData.yy,
            "date_timezone.month": dateData.mm,
            // "date_timezone.day": 17,
          },
        },
        {
          $group: {
            _id: "$date_timezone.day",
            totaliser: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            totaliser_current_value: {
              $last: "$totaliser.totaliser_current_value",
            },
          },
        },
        { $sort: { _id: 1 } },
      ];
      graphData = await deviceHistory.aggregate(pipeline);
      graphData = JSON.parse(JSON.stringify(graphData));
      let defaultgraphData = generateDefaultPropertiesOfDays(
        graphData,
        dateData
      );
      let demoDate = new Date(dateData.yy, dateData.mm - 1, 1);
      demoDate = new Date(
        moment(demoDate).tz("Asia/calcutta").format("YYYY-MM-DD")
      );
      let demo1Date = new Date(demoDate);
      console.log("demodate", demoDate);
      demoDate.setDate(demoDate.getDate() - 1);
      console.log("After substracting to find previous month date", demoDate);
      let mergeArrayResponse = [...graphData, ...defaultgraphData];
      graphData = sortResponsePeriodWise(mergeArrayResponse);
      console.log(
        "length of Month statistics  graph data",
        mergeArrayResponse.length
      );
      let historyData = await deviceHistory.findData(
        {
          deviceId: mongoose.Types.ObjectId(req.query.deviceId),
          date: {
            $gte: new Date(new Date(demoDate)),
            $lte: new Date(new Date(demo1Date)),
          },
        },
        {},
        {
          sort: { date: -1 },
          limit: 1,
        }
      );
      // console.log("Previous Month record", historyData);
      for (let i = mergeArrayResponse.length - 1; i > 0; i--) {
        if (
          graphData[i]["totaliser_current_value"] !== 0 &&
          graphData[i]["totaliser_current_value"] >=
            graphData[i - 1]["totaliser_current_value"]
        ) {
          graphData[i]["totaliser_current_value"] =
            graphData[i]["totaliser_current_value"] -
            graphData[i - 1]["totaliser_current_value"];
          console.log("i, i-1", i, i - 1);
          console.log(
            "SUbstraction",
            graphData[i]["totaliser_current_value"] -
              graphData[i - 1]["totaliser_current_value"]
          );
        }
      }
      if (historyData && historyData.length > 0) {
        if (
          graphData[0]["totaliser_current_value"] !== 0 &&
          graphData[0]["totaliser_current_value"] >=
            historyData[0]["totaliser_current_value"]
        ) {
          graphData[0]["totaliser_current_value"] =
            graphData[0]["totaliser_current_value"] -
            historyData[0]["totaliser_current_value"];
        }
      }
    }

    res.send(graphData);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
const sortResponsePeriodWise = (array) => {
  let sortedPeriodWiseArray = array.sort(function (a, b) {
    return Number(new Date(a.date)) - Number(new Date(b.date));
  });
  return sortedPeriodWiseArray;
};
const sortResponsePeriodWiseByHours = (array) => {
  let sortedPeriodWiseArray = array.sort(function (a, b) {
    return a._id - b._id;
  });
  return sortedPeriodWiseArray;
};
const generateDefaultPropertiesOfHours = (data) => {
  let totalHours = PERIOD_DATA.HOURS;
  let hourIncludedInDBResponse = data.map((hour) => hour._id);
  let hourNotIncludedInDBResponse = totalHours.filter(
    (x) => !hourIncludedInDBResponse.includes(x)
  );
  console.log("hoursinclude", hourIncludedInDBResponse);
  let generateNotIncludedHourResponse = hourNotIncludedInDBResponse.map(
    (hour) => defaultBatteryProperty(hour)
  );
  console.log("hoursnotincluded", hourNotIncludedInDBResponse);
  return generateNotIncludedHourResponse;
};
const generateDefaultPropertiesOfDays = (data, dateData) => {
  let { yy, mm } = dateData;
  console.log("Inside Default properties of months", dateData);
  const thirtyDaysMonths = PERIOD_DATA.THIRTY_DAY_MONTHS;
  let totalDays = PERIOD_DATA.DAYS;
  let isLeapYear = checkLeapYear(yy);
  let dayIncludedInDBResponse = data.map((day) => day._id);

  // List of days not included in response. it is upto 31st day
  let dayNotIncludedInDBResponse = totalDays.filter(
    (x) => !dayIncludedInDBResponse.includes(x)
  );

  // If it is month of 30, yes then remove 31 from array
  if (thirtyDaysMonths.includes(mm)) {
    const index = dayNotIncludedInDBResponse.indexOf(31);
    if (index > -1) dayNotIncludedInDBResponse.splice(index, 1);
  }

  // if month of feb and leap year than there is 29 days otherwise 28 days
  if (mm === 2) {
    if (isLeapYear) {
      const index = dayNotIncludedInDBResponse.indexOf(30);
      if (index > -1) dayNotIncludedInDBResponse.splice(index, 2);
    } else {
      const index = dayNotIncludedInDBResponse.indexOf(29);
      if (index > -1) dayNotIncludedInDBResponse.splice(index, 3);
    }
  }
  console.log(">>>", dayNotIncludedInDBResponse);
  let generateNotIncludedDayResponse = dayNotIncludedInDBResponse.map((day) => {
    return defaultBatteryProperty(day);
  });
  return generateNotIncludedDayResponse;
};
const checkLeapYear = (year) => {
  const isLeapYear = year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
  return isLeapYear;
};
const generateDefaultPropertiesOfWeek = (data) => {
  let dates1 = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
  console.log("origin timezone Date", dates1);
  let totalDays = [];
  //dates1.setDate(dates.getDate() + 2);
  dates1.setDate(dates1.getDate() - 9);
  console.log(">>++", dates1);
  for (let i = 0; i <= 7; i++) {
    let ansDate = new Date(
      moment(dates1.setDate(dates1.getDate() + 1))
        .tz("Asia/calcutta")
        .format("YYYY-MM-DD")
    ); //.toDateString();
    totalDays.push(ansDate);
  }
  console.log("list of week days", totalDays);
  totalDays = JSON.parse(JSON.stringify(totalDays));
  let dayIncludedInDBResponse = data.map(
    (day) => new Date(moment(day.date).format("YYYY-MM-DD:h:m:s"))
  );
  dayIncludedInDBResponse = JSON.parse(JSON.stringify(dayIncludedInDBResponse));
  dayIncludedInDBResponse = dayIncludedInDBResponse.map(
    (day) => day.split("T")[0]
  );
  totalDays = totalDays.map((day) => day.split("T")[0]);
  console.log(" After dayincluded", dayIncludedInDBResponse);
  console.log("After  daynotincluded", totalDays);
  let dayNotIncludedInDBResponse = totalDays.filter((x) => {
    console.log(dayIncludedInDBResponse.includes(x));
    return !dayIncludedInDBResponse.includes(x);
  });

  console.log("notinculded", dayNotIncludedInDBResponse);
  let generateNotIncludedDayResponse = dayNotIncludedInDBResponse.map((day) => {
    return defaultBatteryPropertyOfWeek(day);
  });
  // console.log("generated response", generateNotIncludedDayResponse);
  return generateNotIncludedDayResponse;
};
export const mailDeviceGraphData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: mailDeviceGraphData()`);
  try {
    const output = `
    <h2>Hello</h2>
    <h3>Graph.</h3>
    <h4>Regards,<h4>
    <img src="data:image/png;base64,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"/>
   <h4>Bacancy Systems</h4>`;
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
        to: `${req.body.email}`, // list of receivers
        subject: "Requested  Device History", // Subject line
        text: "Hello world?", // plain text body
        html: output, // html body
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("error in sending", error);
        } else {
          // res.status(200).send("true");
          console.log("no error");
        }
        // console.log("Message sent: %s", info.messageId);
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      });
      let dataObject = {
        message: "Mail sent succesfully",
      };
      return handleResponse(res, dataObject);
    }, 2000);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
