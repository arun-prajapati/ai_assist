import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../..../../config/database/mongoDBOperation";
const schema = {
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Devices",
    trim: true,
  },
  alertName: {
    type: String,
  },
  Date: {
    type: Date,
  },
  time: { type: String },
  errorFrom: { type: String },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "AlertHistory";
let alertHistorySchema = Schema(schema, schemaOption);

let alertModel = model(modelName, alertHistorySchema);
let AlertsHistory = new SchemaModel(alertModel);

export default AlertsHistory;
