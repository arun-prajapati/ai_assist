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
export const addAlertconfigurationData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: addAlertconfigurationData()`);
  try {
    let deviceData = await Devices.findOneDocument({ _id: req.body.deviceId });
    req.body.name = deviceData.name;
    await Alerts.createData(req.body);
    let dataObject = {
      message: "Alert Configuration Added succesfully",
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const getAlertconfigurationData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: getAlertconfigurationData()`);
  try {
    let alertConfigurationData = await Alerts.findData(
      {},
      { createdAt: 0, updatedAt: 0 }
    );
    let dataObject = {
      message: "Alert Configuration Fetched succesfully",
      data: alertConfigurationData,
      count: alertConfigurationData.length,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const updateAlertconfigurationData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: updateAlertconfigurationData()`);
  try {
    let alertData = await Alerts.findOneDocument({ _id: req.params.id });
    if (!alertData) {
      throw new Error("No Device Found");
    }
    let updatefields = {
      alertName: req.body.alertName,
      receiverEmail: req.body.receiverEmail,
      subject: req.body.subject,
      description: req.body.description,
    };
    if (req.body.deviceId) {
      let deviceData = await Devices.findOneDocument({
        _id: req.body.deviceId,
      });
      req.body.name = deviceData.name;
      updatefields = {
        ...updatefields,
        deviceId: req.body.deviceId,
        name: req.body.name,
      };
    }
    await Alerts.updateData(
      {
        _id: req.body.id,
      },
      updatefields
    );
    let dataObject = {
      message: "Alert Configuration updated succesfully",
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const deleteAlertconfigurationData = async (req, res, next) => {
  logger.log(level.info, `>> Controller: deleteAlertconfigurationData()`);
  try {
    let alertData = await Alerts.findOneDocument({ _id: req.params.id });
    if (!alertData) {
      throw new Error("No Device Found");
    }
    await Alerts.deleteData({ _id: req.params.id });
    let dataObject = {
      message: "Alert Configuration Deleted succesfully",
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
