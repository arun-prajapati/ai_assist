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
const excel = require("exceljs");

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
      let FA09payload = createFA09payload(url);
      console.log("paylodFA09MSG", FA09payload);
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
            "https://bacancy-system-nptl.s3.ap-south-1.amazonaws.com/" + e.Key
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
  logger.log(level.info, `>> Controller: downloadDeviceHistoryData()`);
  try {
    // console.log(
    //   ">>>",
    //   new Date(new Date(req.body.startDate).setHours(0, 0, 0))
    // );
    // console.log(
    //   ">>>",
    //   new Date(new Date(req.body.endDate).setHours(23, 59, 59))
    // );
    let historyData = await deviceHistory.findData(
      {
        deviceId: req.query.deviceId,
        // date: {
        //   $gte: new Date(new Date(req.body.startDate).setHours(0, 0, 0)),
        //   $lte: new Date(new Date(req.body.endDate).setHours(23, 59, 59)),
        // },
      },
      {
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
    //  / console.log("Final Array of object of history Data", data);
    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("Devicehistory");
    worksheet.columns = [
      { header: "Id", key: "Id", width: 5 },
      { header: "flowValue", key: "flowValue", width: 25 },
      { header: "flowUnit", key: "flowUnit", width: 25 },
      { header: "pumpCurrentstate", key: "pumpCurrentstate", width: 10 },
      { header: "valveCurrentstate", key: "valveCurrentstate", width: 10 },
      {
        header: "totaliser_current_value",
        key: "totaliser_current_value",
        width: 10,
      },
      { header: "pmac", key: "pmac", width: 10 },
      { header: "vmac", key: "vmac", width: 10 },
    ];
    worksheet.addRows(data);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "DeviceHistory.xlsx"
    );
    
    return workbook.xlsx.write(res).then(function () {
      res.status(200).end();
    });
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
