import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../..../../config/database/mongoDBOperation";
const schema = {
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    trim: true,
  },
  alertName: {
    type: [String],
  },
  receiverEmail: {
    type: [String],
  },
  subject: {
    type: String,
  },
  Description: { type: String },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Alert";
let alertSchema = Schema(schema, schemaOption);

let alertModel = model(modelName, alertSchema);
let Alerts = new SchemaModel(alertModel);

export default Alerts;
