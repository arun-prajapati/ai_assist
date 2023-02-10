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
    question_attempt:String,
    time:String,
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Studys";
let studySchema = Schema(schema, schemaOption);

let studyModel = model(modelName, studySchema);
let Studys = new SchemaModel(studyModel);

export default Studys;
