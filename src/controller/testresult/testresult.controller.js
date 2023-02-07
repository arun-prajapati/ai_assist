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
  import Topics from "../../models/topic.model";
  import nodemailer from "nodemailer";
  import ejs from "ejs";
  import pdf from "html-pdf";
  const mongoose = require("mongoose");
  
  export const createTestresult = async (req, res, next) => {
    logger.log(level.info, `✔ Controller createTestresult()`);
    let body = req.body;
    try {
      let testResultData = await TestResults.createData(body);
      let dataObject = { message: "test result created succesfully",data:testResultData };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const getTestResult = async (req, res, next) => {
    logger.log(level.info, `✔ Controller getTestResult()`);
    try {
      let testresultData = await TestResults.aggregate([
        {
          '$match': {
            'topicId': mongoose.Types.ObjectId(req.body.topicId)
          }
        },      
        {
          '$sort': {
            'createdAt': -1
          }
        }, {
          '$limit': 2
        }, {
          '$lookup': {
            'from': 'testqas', 
            'localField': '_id', 
            'foreignField': 'testId', 
            'as': 'questionanswerdata'
          }
        }
      ]);
      let dataObject = {
        message: "testresult data fetched succesfully",
        count: testresultData.length,
        data: testresultData,
      };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const updateTestresult = async (req, res, next) => {
    logger.log(level.info, `>> Controller: updateTestresult()`);
    try {
      let {
        no_of_question,
        time_taken,
        studentId,
        topicId
      } = req.body;
      let updateTestresultObject = {
        no_of_question,
        time_taken,
        studentId,
        topicId
      };
      let updatetestresultData = await TestResults.updateData(
        { _id: req.params.testresultId },
        updateTestresultObject
      );   
      let dataObject = { message: "test result Updated succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  