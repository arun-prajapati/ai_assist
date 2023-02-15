import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../config/database/mongoDBOperation";
const schema = {
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestResults",
        trim: true,
      },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        trim: true,
    },
    question:String,
    answer:String,
    usersanswer:String,
    is_default:Boolean
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Testqa";
let testqaSchema = Schema(schema, schemaOption);

let testqaModel = model(modelName, testqaSchema);
let Testqa = new SchemaModel(testqaModel);

export default Testqa;
