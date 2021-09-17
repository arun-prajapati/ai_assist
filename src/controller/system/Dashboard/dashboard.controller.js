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
let dates = new Date(moment().tz("Asia/calcutta").format());
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
    let deviceCountObject = { Unconfigured: 0, Online: 0, Offline: 0 };
    for (let i = 0; i < deviceCountData.length; i++) {
      if (
        deviceCountData[i]["_id"]["pstate"] === 0 ||
        deviceCountData[i]["_id"]["vstate"] === 0
      ) {
        deviceCountObject.Unconfigured++;
      } else if (
        deviceCountData[i]["_id"]["pstate"] === 1 &&
        deviceCountData[i]["_id"]["vstate"] === 1
      ) {
        deviceCountObject.Online++;
      } else if (
        deviceCountData[i]["_id"]["pstate"] === 2 ||
        deviceCountData[i]["_id"]["vstate"] === 2
      ) {
        deviceCountObject.Offline++;
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
  let graphData;
  console.log("", dateData);
  try {
    let pipeline;
    if (req.query.type === "day") {
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
      let defaultgraphData = generateDefaultPropertiesOfHours(graphData);
      let mergeArrayResponse = [...graphData, ...defaultgraphData];
      graphData = sortResponsePeriodWise(mergeArrayResponse);
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
