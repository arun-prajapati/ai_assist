import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../config/database/mongoDBOperation";
const schema = {
 studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    trim: true,
  },
  name: {
    type: String,
  },
  is_favourite: {
    type: Boolean,
    default:false
  },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Subjects";
let subjectSchema = Schema(schema, schemaOption);

let subjectModel = model(modelName, subjectSchema);
let Subjects = new SchemaModel(subjectModel);

export default Subjects;
