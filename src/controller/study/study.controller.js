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
  import Studys from "../../models/study.model";
  import nodemailer from "nodemailer";
  import ejs from "ejs";
  import pdf from "html-pdf";
  const mongoose = require("mongoose");
  
  export const createStudy = async (req, res, next) => {
    logger.log(level.info, `✔ Controller createStudy()`);
    let body = req.body;
    try {
      let studyData = await Studys.createData(body);
      let dataObject = { message: "study data created succesfully",data:studyData };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const getStudyResult = async (req, res, next) => {
    logger.log(level.info, `✔ Controller getStudyResult()`);
    try {
      let studyresultData = await Studys.aggregate([
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
            'from': 'studyqas', 
            'localField': '_id', 
            'foreignField': 'studyId', 
            'as': 'studyqaData'
          }
        }
      ]);
      var dates2 = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      dates2.setDate(dates2.getDate());
      var dates3 = new Date(moment().tz("Asia/calcutta").format("YYYY-MM-DD"));
      dates3.setDate(dates3.getDate() - 8);
      console.log("dates2",dates2)
      console.log("dates3",dates3)
      let demo=await Studys.aggregate([{
        '$addFields': {
          'date_timezone': {
            '$dateToParts': {
              'date': '$createdAt'
            }
          }
        }
      },
      {
        '$match': {
          'topicId': mongoose.Types.ObjectId(req.body.topicId),
          createdAt: {
            $gte: new Date(new Date(dates3)),
            $lt: new Date(new Date(dates2).setHours(23, 59, 59)),
          },
        }
      },
      {
        '$group': {
          '_id': '$date_timezone.day', 
          'total': {
            '$sum': {
              '$toDouble': '$time'
            }
          }, 
          'dates': {
            '$first': '$createdAt'
          }
        }
      }
    ])
    console.log("demo",demo)
    for(let i=0;i<demo.length;i++)
    {
      var date = new Date(demo[i]["dates"]);
      demo[i]["dates"]=demo[i]["dates"].toLocaleDateString().split("T")[0]
      demo[i]["day"]=date.toLocaleDateString("en-US", { weekday: 'long' })
    }
    console.log('demo',demo)
    let finalanswer=[]
    finalanswer.push({studyresultData})
    finalanswer.push({...demo})
      // let dataObject = {
      //   message: "studyresult data fetched succesfully",
      //   count: studyresultData.length,
      //   data: finalanswer,
      // };
      res.status(200).json({
        error: false,
        statusCode:200,
        message: "studyresult data fetched succesfully",
        count: studyresultData.length,
        data:finalanswer,
        dailyTimeForLastSevenDays:demo
      });
      // return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const updateStudy = async (req, res, next) => {
    logger.log(level.info, `>> Controller: updateStudy()`);
    try {
      let {
        question_attempt,
        time,
        studentId,
        topicId
      } = req.body;
      let updateStudyObject = {
        question_attempt,
        time,
        studentId,
        topicId
      };
      let studyData = await Studys.updateData(
        { _id: req.params.studyId },
        updateStudyObject
      );   
      let dataObject = { message: "study data Updated succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  