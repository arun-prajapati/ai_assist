import {
    BadRequestError,
    InternalServerError,
  } from "../../helpers/errors/custom-error";
  import moment from "moment";
  import {
    //createResponse,
    handleResponse,
    //databaseparser,
    flowCoversion,
  } from "../../helpers/utility";
  import path from "path";
  import { logger, level } from "../../config/logger/logger";
  import TestResults from "../../models/testresult.model";
  import Testqa from "../../models/testqa.model";
  import nodemailer from "nodemailer";
  import ejs from "ejs";
  import pdf from "html-pdf";
  const mongoose = require("mongoose");
  
  export const createTestresultqa = async (req, res, next) => {
    logger.log(level.info, `✔ Controllerss createTestresultqa()`);
    let body = req.body;
    try {
      let testResultqaData = await Testqa.createData(body);
      let dataObject = { message: "Testqa result created succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  