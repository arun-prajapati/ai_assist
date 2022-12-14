// const mongoose = require("mongoose");
import { Schema, model } from "mongoose";
import SchemaModel from "../config/database/mongoDBOperation";

const schema = {
  id: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
  otp: {
    type: String,
  },
  expiration_time: {
    type: Date,
  },
  verified: Boolean,
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "OTP";
let otpSchema = Schema(schema, schemaOption);

let otpModel = model(modelName, otpSchema);
let OTPS = new SchemaModel(otpModel);

export default OTPS;
