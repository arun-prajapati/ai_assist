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
import Alerts from "../../../models/alert.model";
import moment from "moment";
const mongoose = require("mongoose");
//const  multer=require('multer')
import multer from "multer";
import uniqid from "uniqid";
const REPLACE_DELIMETER = "*";
const CLOUD_TO_ESP_TOPIC = process.env.CLOUD_TO_ESP || "SensieTech/*/c2f";
export const manageCommandsData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: manageCommandsData()`);
  try {
    let { pmac, vmac, msgId, deviceId } = req.body;
    let device = await Devices.findOneDocument({
      $or: [{ pmac: pmac }, { vmac: vmac }],
    });
    if (device) {
      let MSG_TO_PUBLISH;
      switch (msgId) {
        case "FA0A": {
          MSG_TO_PUBLISH = "AAAAFA0A005555";
          break;
        }
        case "FA0B": {
          MSG_TO_PUBLISH = "AAAAFA0B005555";
          break;
        }
        case "FA0C": {
          MSG_TO_PUBLISH = "AAAAFA0C005555";
          break;
        }
        case "FA0D": {
          MSG_TO_PUBLISH = "AAAAFA0D005555";
          break;
        }
        case "FA0E": {
          MSG_TO_PUBLISH = "AAAAFA0E005555";
          break;
        }
      }
      let PUMP_TOPIC, VALVE_TOPIC;
      if (pmac) {
        PUMP_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, pmac);
        mqttClient.publish(PUMP_TOPIC, MSG_TO_PUBLISH);
      } else if (vmac) {
        VALVE_TOPIC = CLOUD_TO_ESP_TOPIC.replace(REPLACE_DELIMETER, vmac);
        mqttClient.publish(VALVE_TOPIC, MSG_TO_PUBLISH);
      }
      let dataObject = {
        message: "Request sent successfully",
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
