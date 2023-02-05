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
  import nodemailer from "nodemailer";
  import ejs from "ejs";
  import pdf from "html-pdf";
  const mongoose = require("mongoose");
  
  export const createSubject = async (req, res, next) => {
    logger.log(level.info, `✔ Controller createSubject()`);
    let body = req.body;
    try {
      let subjectData = await Subjects.createData(body);
      let dataObject = { message: "Subject created succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const getSubjects = async (req, res, next) => {
    logger.log(level.info, `✔ Controller getSubjects()`);
    try {
      let subjectData = await Subjects.findData({studentId:req.body.studentId});
      let dataObject = {
        message: "subject data fetched succesfully",
        count: subjectData.length,
        data: subjectData,
      };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const getSingleSubject = async (req, res, next) => {
    logger.log(level.info, `✔ Controller getSingleSubject()`);
    try {
      let subjectData = await Subjects.findOneDocument({
        _id: req.params.subjectId,
      });   
      let dataObject = {
        message: "subject details fetched succesfully",
        data: subjectData,
      };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const removeSingleSubject = async (req, res, next) => {
    logger.log(level.info, `✔ Controller removeSingleSubject()`);
    try {
      let subjectData = await Subjects.deleteData({ _id: req.params.subjectId });
      let dataObject = { message: "subject details deleted succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const updateSubject = async (req, res, next) => {
    logger.log(level.info, `>> Controller: updateSubject()`);
    try {
      let {
        name,
        is_favourite
      } = req.body;
      let updateSubjectObject = {
        name,
        is_favourite
      };
      let updatesubjectData = await Subjects.updateData(
        { _id: req.params.subjectId },
        updateSubjectObject
      );   
      let dataObject = { message: "Device Updated succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  