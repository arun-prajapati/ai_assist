import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../../../helpers/errors/custom-error";
import {
  //createResponse,
  handleResponse,
  //databaseparser,
} from "../../../helpers/utility";
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
    let historyData = await deviceHistory.findData({
      deviceId: req.query.deviceId,
      date: {
        //moment.tz(start, "Asia/calcutta").format("DDMMYYYY")
        $gte: new Date(new Date(req.body.startDate).setHours(0, 0, 0)), //.toLocaleString("en-US", { timeZone: "Asia/calcutta" }),
        $lte: new Date(new Date(req.body.endDate).setHours(23, 59, 59)), //.toLocaleString("en-US", { timeZone: "Asia/calcutta" }),
      },
    });
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
    console.log("reqfile", reqfile);
    console.log("myfile", myfile);
    console.log("filetype", filetype);
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${uniqid()}.${filetype}`,
      Body: reqfile.buffer,
    };
    console.log("params", params);
    s3.upload(params, (error, data) => {
      if (error) {
        return res.status(404).send(error);
      } else {
        console.log("Passed in AWS upload", data);
        return res.status(200).send(data);
      }
    });
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
