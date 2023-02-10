import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../config/database/mongoDBOperation";
const schema = {
    studyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Studys",
        trim: true,
      },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        trim: true,
    },
    question:String,
    answer:String,
    try:Number,
    hint:Boolean
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Studyqa";
let studyqaSchema = Schema(schema, schemaOption);

let studyqaModel = model(modelName, studyqaSchema);
let Studyqa = new SchemaModel(studyqaModel);

export default Studyqa;
