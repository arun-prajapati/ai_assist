import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  handleError,
} from "../../../helpers/errors/custom-error";
import {
  createResponse,
  handleResponse,
  //databaseparser,
} from "../../../helpers/utility";
import nodemailer from "nodemailer";
const CsvParser = require("json2csv").Parser;
import { mqttClient } from "../../../config/mqtt/mqtt";
import { logger, level } from "../../../config/logger/logger";
import deviceHistory from "../../../models/deviceHistory.model";
import Devices from "../../../models/device.model";
import moment from "moment";
//const  multer=require('multer')
import multer from "multer";
import uniqid from "uniqid";
//const aws=require('aws-sdk')
import aws from "aws-sdk";
import { createFA09payload } from "../../../services/mqtt/hardwareResponse";
import { restart } from "nodemon";
const REPLACE_DELIMETER = "*";
const CLOUD_TO_ESP_TOPIC = process.env.CLOUD_TO_ESP || "SensieTech/*/c2f";
export const getDeviceHistoryData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: getDeviceHistoryData()`);
  try {
    console.log(
      ">>>",
      new Date(new Date(req.body.startDate).setHours(0, 0, 0))
    );
    console.log(
      ">>>",
      new Date(new Date(req.body.endDate).setHours(23, 59, 59))
    );
    let historyData = await deviceHistory.findData(
      {
        deviceId: req.query.deviceId,
        date: {
          //moment.tz(start, "Asia/calcutta").format("DDMMYYYY")
          $gte: new Date(new Date(req.body.startDate).setHours(0, 0, 0)), //.toLocaleString("en-US", { timeZone: "Asia/calcutta" }),
          $lte: new Date(new Date(req.body.endDate).setHours(23, 59, 59)), //.toLocaleString("en-US", { timeZone: "Asia/calcutta" }),
        },
      },
      {
        date: 1,
        time: 1,
        flowValue: 1,
        flowUnit: 1,
        totaliser_current_value: 1,
        valveCurrentstate: 1,
        pumpCurrentstate: 1,
        pstate: 1,
        vstate: 1,
      }
    );
    let dataObject = {
      message: "Device history fetched succesfully",
      count: historyData.length,
      data: historyData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const firmwareVersion = async (req, res, next) => {
  logger.log(level.info, `>> Controller: firmwareVersion()`);
  try {
    let { pmac, vmac, url } = req.body;
    let device = await Devices.findOneDocument({
      $or: [{ pmac: pmac }, { vmac: vmac }],
    });
    if (device) {
      let PUMP_TOPIC, VALVE_TOPIC;
      url = url.replace("https", "http");
      let FA09payload = createFA09payload(url);
      console.log("paylodFA09MSG ", FA09payload);
      if (pmac && vmac) {
        console.log("both");
        PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, pmac);
        VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, vmac);
        mqttClient.publish(PUMP_TOPIC, FA09payload);
        mqttClient.publish(VALVE_TOPIC, FA09payload);
      } else if (pmac) {
        console.log("pmac");
        PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, pmac);
        mqttClient.publish(PUMP_TOPIC, FA09payload);
        await Devices.updateData(
          {
            pmac: pmac,
          },
          {
            url: url,
          }
        );
      } else if (vmac) {
        console.log("vmac");
        VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, vmac);
        mqttClient.publish(VALVE_TOPIC, FA09payload);
        await Devices.updateData(
          {
            vmac: vmac,
          },
          {
            url: url,
          }
        );
      }

      let dataObject = {
        message: "OTA version sent successfully",
      };
      return handleResponse(res, dataObject);
    }
    return next(new NotFoundError());
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const uploadFirmwareVersion = async (request, res, next) => {
  logger.log(level.info, `>> Controller: uploadFirmwareVersion()`);
  try {
    const s3 = new aws.S3({
      accessKeyId: process.env.AWS_ID,
      secretAccessKey: process.env.AWS_SECRET,
    });
    const reqfile = request.file;

    let myfile = reqfile.originalname.split(".");
    let filetype = myfile[myfile.length - 1];
    // console.log("reqfile", reqfile);
    // console.log("myfile", myfile);
    // console.log("filetype", filetype);
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${request.body.fileName}.${filetype}`,
      Body: reqfile.buffer,
    };
    // console.log("params", params);
    const params1 = {
      Bucket: process.env.AWS_BUCKET_LIST_NAME,
      Prefix: process.env.FOLDER_NAME,
    };
    let list = [];
    let nameExist;
    s3.listObjects(params1, function (err, data) {
      if (err) {
        throw new Error("File retrieving faileddd");
      } else {
        const { Contents } = data;
        Contents.forEach((e) => {
          list.push(e.Key);
        });
        nameExist = list.includes(
          `SensieTech/${request.body.fileName}.${filetype}`
        );
        console.log("name", nameExist);
        if (nameExist) {
          return res.status(503).json({
            error: true,
            statusCode: 503,
            message: "File name must be unique",
          });
        } else {
          s3.upload(params, (error, data) => {
            if (error) {
              throw new Error("File uploading failed");
            } else {
              console.log("Passed in AWS upload", data);
              let dataObject = {
                message: "File uploaded successfully",
              };
              return handleResponse(res, dataObject);
            }
          });
        }
      }
    });
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const listFirmwareVersions = async (request, res, next) => {
  logger.log(level.info, `>> Controller: listFirmwareVersions()`);
  try {
    const s3 = new aws.S3({
      accessKeyId: process.env.AWS_ID,
      secretAccessKey: process.env.AWS_SECRET,
    });
    const params = {
      Bucket: process.env.AWS_BUCKET_LIST_NAME,
      Prefix: process.env.FOLDER_NAME,
    };
    console.log("params", params);
    s3.listObjects(params, function (err, data) {
      if (err) {
        throw new Error("File retrieving failed");
      } else {
        const { Contents } = data;
        var demo = [];
        Contents.forEach((e) => {
          demo.push(
            "http://bacancy-system-nptl.s3.ap-south-1.amazonaws.com/" + e.Key
          );
        });
        console.log(demo);
        let dataObject = {
          data: demo,
          message: "Firmware version retrieved successfully",
        };
        return handleResponse(res, dataObject);
      }
    });
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const downloadDeviceHistoryData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: downloadDeviceHistoryDatas()`);
  try {
    console.log(
      ">>>",
      new Date(
        moment(req.query["startDate"]).tz("Asia/calcutta").format("YYYY-MM-DD")
      )
    );
    console.log(
      ">>>",
      new Date(
        moment(req.query["endDate"]).tz("Asia/calcutta").format("YYYY-MM-DD")
      )
    );
    // let demo = new Date(
    //   moment(req.query["startDate"]).tz("Asia/calcutta").format("YYYY-MM-DD")
    // );

    // console.log(demo);
    let historyData = await deviceHistory.findData(
      {
        deviceId: req.query.deviceId,
        date: {
          $gte: new Date(
            moment(req.query["startDate"])
              .tz("Asia/calcutta")
              .format("YYYY-MM-DD")
          ),
          $lte: new Date(
            moment(req.query["endDate"])
              .tz("Asia/calcutta")
              .format("YYYY-MM-DD")
          ),
        },
      },
      {
        date: 1,
        pmac: 1,
        vmac: 1,
        pumpCurrentstate: 1,
        valveCurrentstate: 1,
        flowValue: 1,
        flowUnit: 1,
        totaliser_current_value: 1,
      }
    );
    let data = [];
    for (const row of historyData) {
      let historyDataObject = {
        Id: row._id,
        date: row.date,
        flowValue: row.flowValue,
        flowUnit: row.flowUnit,
        pumpCurrentstate: row.pumpCurrentstate ? "online" : "offline",
        valveCurrentstate: row.valveCurrentstate ? "online" : "offline",
        totaliser_current_value: row.totaliser_current_value,
        pmac: row.pmac,
        vmac: row.vmac,
      };
      data.push(historyDataObject);
    }
    console.log("Final Array of object of history Data", data);
    const csvFields = [
      "Id",
      "date",
      "flowValue",
      "flowUnit",
      "pumpCurrentstate",
      "valveCurrentstate",
      "totaliser_current_value",
      "pmac",
      "vmac",
    ];
    const csvParser = new CsvParser({ csvFields });
    const csvData = csvParser.parse(data);
    console.log("csvData", csvData);
    res.setHeader("Content-Type", "csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Devicehistory.csv"
    );
    res.status(200).end(csvData);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const mailDeviceHistoryData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: mailDeviceHistoryData()`);
  try {
    console.log(
      ">>>",
      new Date(
        moment(req.query["startDate"]).tz("Asia/calcutta").format("YYYY-MM-DD")
      )
    );
    console.log(
      ">>>",
      new Date(
        moment(req.query["endDate"]).tz("Asia/calcutta").format("YYYY-MM-DD")
      )
    );
    // let demo = new Date(
    //   moment(req.query["startDate"]).tz("Asia/calcutta").format("YYYY-MM-DD")
    // );

    // console.log(demo);
    let historyData = await deviceHistory.findData(
      {
        deviceId: req.query.deviceId,
        date: {
          $gte: new Date(
            moment(req.query["startDate"])
              .tz("Asia/calcutta")
              .format("YYYY-MM-DD")
          ),
          $lte: new Date(
            moment(req.query["endDate"])
              .tz("Asia/calcutta")
              .format("YYYY-MM-DD")
          ),
        },
      },
      {
        date: 1,
        pmac: 1,
        vmac: 1,
        pumpCurrentstate: 1,
        valveCurrentstate: 1,
        flowValue: 1,
        flowUnit: 1,
        totaliser_current_value: 1,
      }
    );
    let data = [];
    for (const row of historyData) {
      let historyDataObject = {
        Id: row._id,
        date: row.date,
        flowValue: row.flowValue,
        flowUnit: row.flowUnit,
        pumpCurrentstate: row.pumpCurrentstate ? "online" : "offline",
        valveCurrentstate: row.valveCurrentstate ? "online" : "offline",
        totaliser_current_value: row.totaliser_current_value,
        pmac: row.pmac,
        vmac: row.vmac,
      };
      data.push(historyDataObject);
    }
    console.log("Final Array of object of history Data", data);
    const csvFields = [
      "Id",
      "date",
      "flowValue",
      "flowUnit",
      "pumpCurrentstate",
      "valveCurrentstate",
      "totaliser_current_value",
      "pmac",
      "vmac",
    ];
    const csvParser = new CsvParser({ csvFields });
    const csvData = csvParser.parse(data);
    const output = `
    <h2>Hello</h2>
    <h3>Requested Device History ${req.body.name} details are below attached with.</h3>
    <h4>Regards,<h4>
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
    console.log("csvData", csvData);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
