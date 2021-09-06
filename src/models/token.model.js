import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../..../../config/database/mongoDBOperation";
const schema = {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    trim: true,
    required: true,
  },
  refreshToken: {
    type: String,
    trim: true,
    required: true,
  },
  accessToken: {
    type: String,
    trim: true,
    required: true,
  },
  status: {
    type: Number,
    trim: true,
    required: true,
    default: 1,
  },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Token";
let tokenSchema = Schema(schema, schemaOption);

let tokenModel = model(modelName, tokenSchema);
let Tokens = new SchemaModel(tokenModel);

export default Tokens;
