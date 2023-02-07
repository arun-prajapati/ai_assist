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
  import Cards from "../../models/card.model";
  import Topics from "../../models/topic.model";
  import nodemailer from "nodemailer";
  import ejs from "ejs";
  import pdf from "html-pdf";
  const mongoose = require("mongoose");
  
  export const createCard = async (req, res, next) => {
    logger.log(level.info, `✔ Controller createCard()`);
    let body = req.body;
    try {
      let cardData = await Cards.createData(body);
      let dataObject = { message: "Card created succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const getCards = async (req, res, next) => {
    logger.log(level.info, `✔ Controller getCards()`);
    try {
      let cardData = await Cards.findData({topicId:req.body.topicId});
      let dataObject = {
        message: "card data fetched succesfully",
        count: cardData.length,
        data: cardData,
      };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const getSingleCard = async (req, res, next) => {
    logger.log(level.info, `✔ Controller getSingleCard()`);
    try {
      let cardData = await Cards.findOneDocument({
        _id: req.params.cardId,
      });   
      console.log("cardData",cardData)
      let dataObject = {
        message: "card details fetched succesfully",
        data: cardData,
      };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const removeSingleCard = async (req, res, next) => {
    logger.log(level.info, `✔ Controller removeSingleCard()`);
    try {
      let cardData = await Cards.deleteData({ _id: req.params.cardId });
      let dataObject = { message: "card details deleted succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  
  export const updateCard = async (req, res, next) => {
    logger.log(level.info, `>> Controller: updateCard()`);
    try {
      let {
        topicId,
        question,
        answer,
        hint,
        studentId,
        subjectId
      } = req.body;
      let updateCardObject = {
        topicId,
        question,
        answer,
        hint,
        studentId,
        subjectId
      };
      let updatecardData = await Cards.updateData(
        { _id: req.params.cardId },
        updateCardObject
      );   
      let dataObject = { message: "Card Updated succesfully" };
      return handleResponse(res, dataObject);
    } catch (e) {
      if (e && e.message) return next(new BadRequestError(e.message));
      logger.log(level.error, `Error: ${JSON.stringify(e)}`);
      return next(new InternalServerError());
    }
  };
  