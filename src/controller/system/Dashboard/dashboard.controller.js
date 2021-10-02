import {
  BadRequestError,
  InternalServerError,
} from "../../../helpers/errors/custom-error";
import {
  //createResponse,
  handleResponse,
  //databaseparser,
} from "../../../helpers/utility";
//import * as DeviceSrv from "../../../services/system/device/device.service";
import { logger, level } from "../../../config/logger/logger";
import Devices from "../../../models/device.model";
import deviceHistory from "../../../models/deviceHistory.model";
import { CONSTANTS as PERIOD_DATA } from "../../../constants/periodData";
import moment from "moment";
const mongoose = require("mongoose");
let dates = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD h:mm:ss"));
let dateData = {
  yy: dates.getFullYear(),
  mm: dates.getMonth() + 1,
  dd: dates.getDate(),
};

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
      console.log("historyData", historyData.length);
      if (historyData && historyData.length > 0) {
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
          _id: hours.slice(12, 14),
          totaliser_current_value: deviceData.totaliser_current_value,
        };
        console.log("demo", demo);
        graphData.push(demo);
        //graphData = [];
      }
      graphData = JSON.parse(JSON.stringify(graphData));
      console.log("Graph Data", graphData);
      let defaultgraphData = generateDefaultPropertiesOfHours(graphData);
      let mergeArrayResponse = [...graphData, ...defaultgraphData];
      graphData = sortResponsePeriodWise(mergeArrayResponse);
    } else if (req.query.type === "week") {
      var dates2 = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      dates2.setDate(dates2.getDate() - 1);
      var dates3 = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      dates3.setDate(dates3.getDate() - 8);
      console.log("Week Date after -1", dates2);
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
              $lte: new Date(new Date(dates2)), //.setHours(23, 59, 59),
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
      for (let i = 7; i > 0; i--) {
        if (
          graphData[i]["totaliser_current_value"] !== 0 &&
          graphData[i]["totaliser_current_value"] >=
            graphData[i - 1]["totaliser_current_value"]
        ) {
          graphData[i]["totaliser_current_value"] =
            graphData[i]["totaliser_current_value"] -
            graphData[i - 1]["totaliser_current_value"];
        }
      }
      console.log("merger array", mergeArrayResponse);
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
              $max: "$totaliser.totaliser_current_value",
            },
          },
        },
        { $sort: { _id: 1 } },
      ];
      graphData = await deviceHistory.aggregate(pipeline);
      graphData = JSON.parse(JSON.stringify(graphData));
      let defaultgraphData = generateDefaultPropertiesOfDays(graphData);
      let mergeArrayResponse = [...graphData, ...defaultgraphData];
      graphData = sortResponsePeriodWise(mergeArrayResponse);
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
const generateDefaultPropertiesOfHours = (data) => {
  let totalHours = PERIOD_DATA.HOURS;
  let hourIncludedInDBResponse = data.map((hour) => hour._id);
  let hourNotIncludedInDBResponse = totalHours.filter(
    (x) => !hourIncludedInDBResponse.includes(x)
  );
  let generateNotIncludedHourResponse = hourNotIncludedInDBResponse.map(
    (hour) => defaultBatteryProperty(hour)
  );
  return generateNotIncludedHourResponse;
};
const generateDefaultPropertiesOfDays = (data) => {
  let { yy, mm } = dateData;
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
