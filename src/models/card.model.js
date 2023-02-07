import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../config/database/mongoDBOperation";
const schema = {
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topics",
        trim: true,
      },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        trim: true,
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subjects",
        trim: true,
    },
    question:String,
    answer:String,
    hint:[String],
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Cards";
let cardSchema = Schema(schema, schemaOption);

let cardModel = model(modelName, cardSchema);
let Cards = new SchemaModel(cardModel);

export default Cards;
