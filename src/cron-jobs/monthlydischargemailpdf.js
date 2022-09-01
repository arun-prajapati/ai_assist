import { scheduleJob } from "node-schedule";
import { logger, level } from "../config/logger/logger";
import moment from "moment";
import nodemailer from "nodemailer";
import Notifications from "../models/notification.model";
import Devices from "../models/device.model";
import deviceHistory from "../models/deviceHistory.model";
import * as DeviceSrv from "../services/device/device.service";
import { CONSTANTS as PERIOD_DATA } from "../constants/periodData";
const JOB_TIME = "30 16 * * *";
const mongoose = require("mongoose");
const CsvParser = require("json2csv").Parser;
const MIN = 15; // this minute ago data should be update
let flag=true;
scheduleJob(JOB_TIME, async () => {
  try {
    logger.log(level.info, `>> Monthly Mail Service Run  at ${moment().format()}`);
    var cuurentDate = moment().tz("Asia/calcutta").format("YYYY-MM-DD");
    var lastDayOfMonth = new Date(cuurentDate[0], cuurentDate[1], 0);
    console.log("last Day of month",lastDayOfMonth.getDate())
    console.log("Current Day of month",cuurentDate.getDate())
    console.log("last Day of month",typeof lastDayOfMonth.getDate())
    console.log("Current Day of month",typeof cuurentDate.getDate())
    console.log("Result Please",lastDayOfMonth.getDate() === cuurentDate.getDate())
    if(lastDayOfMonth.getDate() === cuurentDate.getDate())
    {
            let notificationdata = await Notifications.findData();
            let dates = new Date(
                moment().tz("Asia/calcutta").format("YYYY/MM/DD hh:mm:ss")
              );
              let dateData = {
                yy: dates.getFullYear(),
                mm: dates.getMonth() + 1,
                dd: dates.getDate(),
              };
            for (let i = 0; i < notificationdata.length; i++) {
              let siteId = [];
              siteId = siteId.concat(notificationdata[i].siteId);
              console.log("values of i",i,siteId.length)
              let data=[];
              for(let j=0;j<siteId.length;j++)
              {
                console.log("siteId[i]",siteId[j])
                let graphData = [];
              let  pipeline = [
                    {
                      $addFields: {
                        date_timezone: {
                          $dateToParts: { date: "$date" },
                        },
                      },
                    },
                    {
                      $match: {
                        deviceId: mongoose.Types.ObjectId(siteId[j]),
                        "date_timezone.year": dateData.yy,
                        "date_timezone.month": dateData.mm,
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
                  console.log("graphData",graphData)
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
                graphData = sortResponsePeriodWiseByHours(mergeArrayResponse);
                console.log(
                    "length of Month statistics  graph data",
                    mergeArrayResponse.length
                );
                let historyData = await deviceHistory.findData(
                    {
                    deviceId: mongoose.Types.ObjectId(siteId[j]),
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
                let deviceData=await Devices.findOneDocument({_id:siteId[j]})
                let historyDataObject = {
                    SiteName: historyData.length >0? historyData[0].name:deviceData.name,
                    // totaliser_current_value:graphData
                  };
                for (let i = mergeArrayResponse.length - 1; i > 0; i--) {
                    historyDataObject={...historyDataObject,[graphData[i]["_id"]]:0}    
                    if (
                    graphData[i]["totaliser_current_value"] !== 0 &&
                    graphData[i]["totaliser_current_value"] >=
                        graphData[i - 1]["totaliser_current_value"]
                    ) {

                    graphData[i]["totaliser_current_value"] =
                        graphData[i]["totaliser_current_value"] -
                        graphData[i - 1]["totaliser_current_value"];
                        // value=graphData[i]["totaliser_current_value"] -
                        graphData[i - 1]["totaliser_current_value"]
                    console.log("i, i-1", i, i - 1);
                    console.log(
                        "SUbstraction",
                        graphData[i]["totaliser_current_value"] -
                        graphData[i - 1]["totaliser_current_value"]
                    );
                    console.log("flag value",flag)
                    historyDataObject={...historyDataObject,[graphData[i]["_id"]]:graphData[i]["totaliser_current_value"]}
                    // console.log("graphData[i][totaliser_current_value]",graphData[i]["totaliser_current_value"])
        
                    }
                }
                // console.log(" Before historyDataObject",historyDataObject)
                historyDataObject={...historyDataObject,[graphData[0]["_id"]]:0}    
                if (historyData && historyData.length > 0) {
                    if (
                    graphData[0]["totaliser_current_value"] !== 0 &&
                    graphData[0]["totaliser_current_value"] >=
                        historyData[0]["totaliser_current_value"]
                    ) {
                    graphData[0]["totaliser_current_value"] =
                        graphData[0]["totaliser_current_value"] -
                        historyData[0]["totaliser_current_value"];
                        console.log("DEMO ANSWER",graphData[0]["totaliser_current_value"],
                        historyData[0]["totaliser_current_value"])
                        historyDataObject={...historyDataObject,[graphData[0]["_id"]]:graphData[0]["totaliser_current_value"]}   
                    }
                }
                // console.log(" After historyDataObject",historyDataObject)
                // console.log("graphData",graphData)
                data.push(historyDataObject)
                  
                 }
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
                    subject: "Requested Site Monthly Device History", // Subject line
                    text: "Hello world?", // plain text body
                    html: "Device Monthly History", // html body
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
                 console.log("finaldata",data)
            }
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
  };const defaultBatteryProperty = (period) => {
    let data = {
      _id: period,
      totaliser_current_value: 0,
    };
    return data;
  };
  const sortResponsePeriodWiseByHours = (array) => {
    let sortedPeriodWiseArray = array.sort(function (a, b) {
      return a._id - b._id;
    });
    return sortedPeriodWiseArray;
  };