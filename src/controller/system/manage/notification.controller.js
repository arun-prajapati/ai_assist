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
import Notifications from "../../../models/notification.model";
import moment from "moment";
const mongoose = require("mongoose");
//const  multer=require('multer')
import multer from "multer";
import uniqid from "uniqid";

export const addNotificationData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: addNotificationData()`);
  try {
    let deviceData = await Devices.findData({
      _id: { $in: ["6155ae92ceceeb0036c3fde5", "615edffc321f51002b4bcd43"] },
    },{});
    console.log("Device Data", deviceData);
    // await Notifications.createData(req.body);
    // let dataObject = {
    //   message: "Notification Configuration Added succesfully",
    // };
    // return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const getNotificationData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: getNotificationData()`);
  try {
    let NotificationData = await Notifications.findData(
      {},
      { createdAt: 0, updatedAt: 0 }
    );
    let dataObject = {
      message: "Notification Configuration Fetched succesfully",
      data: NotificationData,
      count: NotificationData.length,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
