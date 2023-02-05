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
  import Subjects from "../../models/subject.model";
  import Topics from "../../models/topic.model";
  import nodemailer from "nodemailer";
  import ejs from "ejs";
  import pdf from "html-pdf";
  const mongoose = require("mongoose");
  
  export const createTopic = async (req, res, next) => {
    logger.log(level.info, `✔ Controller createTopic()`);
    let body = req.body;
    try {
      let topicData = await Topics.createData(body);
      let dataObject = { message: "Topic created succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const getTopics = async (req, res, next) => {
    logger.log(level.info, `✔ Controller getTopics()`);
    try {
      let topicData = await Topics.findData({subjectId:req.body.subjectId});
      let dataObject = {
        message: "topicData data fetched succesfully",
        count: topicData.length,
        data: topicData,
      };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const getSingleTopic = async (req, res, next) => {
    logger.log(level.info, `✔ Controller getSingleTopic()`);
    try {
      let topicData = await Topics.findOneDocument({
        _id: req.params.topicId,
      });   
      console.log("topicData",topicData)
      let dataObject = {
        message: "topic details fetched succesfully",
        data: topicData,
      };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const removeSingleTopic = async (req, res, next) => {
    logger.log(level.info, `✔ Controller removeSingleTopic()`);
    try {
      let topicData = await Topics.deleteData({ _id: req.params.topicId });
      let dataObject = { message: "topic details deleted succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const updateTopic = async (req, res, next) => {
    logger.log(level.info, `>> Controller: updateTopic()`);
    try {
      let {
        name,
        exploration_rate,
        progress_score,
        description,
        is_favourite,
        studentId,
        subjectId
      } = req.body;
      let updateTopicObject = {
        name,
        exploration_rate,
        progress_score,
        description,
        is_favourite,
        studentId,
        subjectId
      };
      let updatetopicData = await Topics.updateData(
        { _id: req.params.topicId },
        updateTopicObject
      );   
      let dataObject = { message: "Topic Updated succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  