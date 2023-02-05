import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../config/database/mongoDBOperation";
const schema = {
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
  exploration_rate:String,
  progress_score:String,
  description:String,
  name: {
    type: String,
  },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Topics";
let topicSchema = Schema(schema, schemaOption);

let topicModel = model(modelName, topicSchema);
let Topics = new SchemaModel(topicModel);

export default Topics;
