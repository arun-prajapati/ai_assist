import {
  BadRequestError,
  InternalServerError,
} from "../../../helpers/errors/custom-error";
import moment from "moment";
import {
  //createResponse,
  handleResponse,
  //databaseparser,
  flowCoversion,
} from "../../../helpers/utility";
import path from "path";
import * as DeviceSrv from "../../../services/device/device.service";
import { logger, level } from "../../../config/logger/logger";
import Devices from "../../../models/device.model";
import deviceHistory from "../../../models/deviceHistory.model";
import nodemailer from "nodemailer";
import ejs from "ejs";
import pdf from "html-pdf";
import {
  getHHMMSS,
  publishConfigurationMSG,
  publishScheduleMSG,
} from "../../../services/mqtt/hardwareResponse";
const mongoose = require("mongoose");

export const createDevice = async (req, res, next) => {
  logger.log(level.info, `✔ Controller createDevice()`);
  let body = req.body;
  try {
    if (body.startTime || body.endTime) {
      body.startTime = body.startTime ? getHHMMSS(body.startTime) : undefined;
      body.endTime = body.endTime ? getHHMMSS(body.endTime) : undefined;
    }
    let deviceData = await Devices.createData(body);
    // const output = `
    // <h2>Hello</h2>
    // <h3>Newly Created device named ${req.body.name} successfully  added on portal.Please find below attachment to find configuration details</h3>
    // <h4>Regards,</h4>
    // <h4>Bacancy Systems</h4>`;
    // let transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   port: 25,
    //   secure: false,
    //   auth: {
    //     user: "digi5technologies@gmail.com",
    //     pass: "Digi5vgec@2021",
    //   },
    //   tls: {
    //     rejectUnauthorized: false,
    //   },
    // });
    // let students = [
    //   {
    //     name: req.body.name,
    //     pmac: req.body.pmac,
    //     vmac: req.body.vmac,
    //     threshold: req.body.threshold,
    //     lineSize: req.body.lineSize,
    //     pipeSize: req.body.pipeSize,
    //     operationMode: req.body.operationMode,
    //     payloadInterval: req.body.payloadInterval,
    //     startDate: moment
    //       .tz(req.body.startDate, "Asia/calcutta")
    //       .format("DDMMYYYY"),
    //     endDate: moment
    //       .tz(req.body.endDate, "Asia/calcutta")
    //       .format("DDMMYYYY"),
    //     startTime: req.body.startTime,
    //     endTime: req.body.endTime,
    //   },
    // ];
    // console.log("students", students);
    // console.log(
    //   "folder path",
    //   path.join("../../../views", "report-template.ejs")
    // );
    // await ejs.renderFile(
    //   path.join(__dirname, "../views/", "report-template.ejs"),
    //   {
    //     students: students,
    //   },
    //   async (err, data) => {
    //     if (err) {
    //       console.log(err);
    //       //res.send(err);
    //     } else {
    //       let options = {
    //         height: "11.25in",
    //         width: "8.5in",
    //         header: {
    //           height: "20mm",
    //         },
    //         async: true,
    //         footer: {
    //           height: "20mm",
    //         },
    //       };
    //       pdf
    //         .create(data, options)
    //         .toFile("deviceConfiguration.pdf", function (err, data) {
    //           if (err) {
    //             console.log("ÏNside pdf erro", err);
    //           } else {
    //             console.log("Pdf created successfully");
    //           }
    //         });
    //     }
    //   }
    // );
    // setTimeout(() => {
    //   let mailOptions = {
    //     from: '"digi5technologies@gmail.com" <your@email.com>', // sender address
    //     to: "prempanwala710@gmail.com", // list of receivers
    //     subject: "New Device Added At NEPL", // Subject line
    //     text: "Hello world?", // plain text body
    //     html: output, // html body
    //     attachments: [
    //       {
    //         filename: "deviceConfiguration.pdf",
    //         path: "deviceConfiguration.pdf",
    //         contentType: "application/pdf",
    //       },
    //     ],
    //   };

    //   transporter.sendMail(mailOptions, (error, info) => {
    //     if (error) {
    //       //return console.log(error);
    //       // res.status(200).send("false");
    //     } else {
    //       // res.status(200).send("true");
    //     }
    //     console.log("Message sent: %s", info.messageId);
    //     console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    //   });
    // }, 3000);

    //await DeviceSrv.addDeviceHistoryData(deviceData);
    let dataObject = { message: "Device created succesfully" };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const getDevices = async (req, res, next) => {
  logger.log(level.info, `✔ Controller getDevices()`);
  try {
    let deviceData = await Devices.findData();
    let dataObject = {
      message: "Devices fetched succesfully",
      count: deviceData.length,
      data: deviceData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const getSingleDevice = async (req, res, next) => {
  logger.log(level.info, `✔ Controller getSingleDevice()`);
  try {
    let deviceData = await Devices.findOneDocument({
      _id: req.params.deviceId,
    });
    var dates = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
    dates.setDate(dates.getDate() - 1);
    //dates.setHours(0, 0, 0);
    console.log(">>===", dates);
    let historyData = await deviceHistory.findData(
      {
        deviceId: mongoose.Types.ObjectId(deviceData._id),
        date: {
          $gte: new Date(new Date(dates)), //.toLocaleString("en-US", {
          //timeZone: "Asia/calcutta",
          //}),
          $lte: new Date(new Date(dates)).setHours(23, 59, 59), //.toLocaleString(
          // "en-US",
          //{ timeZone: "Asia/calcutta" }
          //),
        },
      },
      { createdAt: 0 },
      { sort: { date: -1 }, limit: 2 }
    );
    let totaliserValue = deviceData.totaliser_current_value,
      tankCapacity = 0,
      tankValue = 0,
      estimatedTimeValue = 0;
    console.log("historydatalength", historyData.length);
    console.log("histroydata", historyData);
    //console.log("deviceData.threshold", deviceData.threshold);
    if (historyData && historyData.length > 0) {
      let Flow = flowCoversion(deviceData.flowValue, deviceData.flowUnit);
      totaliserValue =
        deviceData.totaliser_current_value -
        historyData[0].totaliser_current_value;
      console.log("totaliserValue", totaliserValue);
      tankValue = Math.round(
        Number(totaliserValue * 100.0) / Number(deviceData.threshold)
      );
      tankCapacity = Number(deviceData.threshold) - Number(totaliserValue);
      console.log("tankCapacity", tankCapacity);
      if (tankCapacity > 0) {
        //deviceData.flowValue
        estimatedTimeValue = tankCapacity / Flow;
        console.log("estimatedTimeValue", estimatedTimeValue);
        console.log("FLOW", Flow);
      } else {
        tankValue = 100;
      }
    }
    console.log("historydata", historyData);
    let deviceDataObject = {
      tankCapacity,
      tankValue,
      estimatedTimeValue,
      totaliserValue,
      name: deviceData.name,
      pmac: deviceData.pmac,
      vmac: deviceData.vmac,
      pstate: deviceData.pstate,
      vstate: deviceData.vstate,
      operationMode: deviceData.operationMode,
      threshold: deviceData.threshold,
      lineSize: deviceData.lineSize,
      pipeSize: deviceData.pipeSize,
      flowValue: deviceData.flowValue,
      flowUnit: deviceData.flowUnit,
      payloadInterval: deviceData.payloadInterval,
      pumpCurrentstate: deviceData.pumpCurrentstate,
      pumpLastUpdated: deviceData.pumpLastUpdated,
      valveCurrentstate: deviceData.valveCurrentstate,
      valveLastUpdated: deviceData.valveLastUpdated,
      startDate: deviceData.startDate,
      endDate: deviceData.endDate,
      startTime: deviceData.startTime,
      endTime: deviceData.endTime,
      pumpVersion: deviceData.pumpVersion,
      valveVersion: deviceData.valveVersion,
    };
    let dataObject = {
      message: "Device fetched succesfully",
      data: deviceDataObject,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const removeDevice = async (req, res, next) => {
  logger.log(level.info, `✔ Controller removeDevice()`);
  try {
    await Devices.deleteData({ _id: req.params.deviceId });
    let dataObject = { message: "Device deleted succesfully" };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const updateDevice = async (req, res, next) => {
  logger.log(level.info, `>> Controller: updateDevice()`);
  try {
    let {
      name,
      location,
      threshold,
      lineSize,
      pipeSize,
      startDate,
      endDate,
      startTime,
      endTime,
      payloadInterval,
    } = req.body;
    let updateDeviceObject = {
      name,
      location,
      lineSize,
      pipeSize,
    };

    let scheduleCondt = startDate || endDate || startTime || endTime;
    let configurationCondt = threshold || payloadInterval;

    if (scheduleCondt) {
      updateDeviceObject = {
        ...updateDeviceObject,
        startDate,
        endDate,
        startTime: startTime ? getHHMMSS(startTime) : undefined,
        endTime: endTime ? getHHMMSS(endTime) : undefined,
      };
      console.log("startTime", startTime);
      console.log("endTime", endTime);
    }
    if (configurationCondt) {
      updateDeviceObject = {
        ...updateDeviceObject,
        threshold,
        payloadInterval,
      };
    }
    let updateDeviceData = await Devices.updateData(
      { _id: req.params.deviceId },
      updateDeviceObject
    );
    //await DeviceSrv.addDeviceHistoryData(updateDeviceData);
    if (scheduleCondt) {
      console.log("inside Scheduling");
      console.log(
        "update device data",
        updateDeviceData,
        updateDeviceData.startDate,
        updateDeviceData.endDate,
        updateDeviceData.startTime,
        updateDeviceData.endTime
      );
      publishScheduleMSG(
        updateDeviceData,
        updateDeviceData.startDate,
        updateDeviceData.endDate,
        updateDeviceData.startTime,
        updateDeviceData.endTime
      );
    }
    if (configurationCondt) {
      console.log("inside configuration");
      publishConfigurationMSG(req.params.deviceId);
    }
    let dataObject = { message: "Device Updated succesfully" };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
