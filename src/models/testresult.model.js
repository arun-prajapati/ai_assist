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
    no_of_question:String,
    time_taken:String,
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "TestResults";
let testresultSchema = Schema(schema, schemaOption);

let testresultModel = model(modelName, testresultSchema);
let TestResults = new SchemaModel(testresultModel);

export default TestResults;
