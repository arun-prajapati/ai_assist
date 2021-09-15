import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../..../../config/database/mongoDBOperation";
const schema = {
  name: {
    type: String,
    trim: true,
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    trim: true,
  },
  pmac: {
    type: String,
    trim: true,
  },
  vmac: {
    type: String,
    trim: true,
  },
  location: {
    type: [Number],
    default: [0, 0],
  },
  pstate: {
    type: Number,
    enum: [0, 1, 2],
    default: 0,
  },
  vstate: {
    type: Number,
    enum: [0, 1, 2],
    default: 0,
  },
  operationMode: {
    type: String,
    enum: ["auto", "manual"],
  },
  threshold: {
    type: Number,
    default: null,
  },
  lineSize: {
    type: Number,
    default: null,
  },
  pipeSize: {
    type: Number,
    default: null,
  },
  flowValue: {
    type: Number,
    default: 13,
  },
  flowUnit: {
    type: String,
    enum: [
      "m3/s",
      "m3/m",
      "m3/h",
      "Lt/s",
      "Lt/m",
      "Lt/h",
      "h1/s",
      "hL/m",
      "hL/h",
      "dL/s",
      "dL/m",
      "BGPS",
      "BGPM",
      "MGD",
      "MLD",
      "CFS",
      "UGPS",
      "UGPM",
      "UGPH",
    ],
    default: "m3/s",
  },
  payloadInterval: {
    type: Number,
    default: 0,
  },
  typeOfSchedule: {
    type: String,
    enum: ["d", "w", "m", "y"],
  },
  date: {
    type: Date,
  },
  time: String,
  pumpCurrentstate: {
    type: Boolean,
    default: false,
  },
  pumpLastUpdated: {
    type: Date,
    default: Date.now,
  },
  valveCurrentstate: {
    type: Boolean,
    default: false,
  },
  valveLastUpdated: {
    type: Date,
    default: Date.now,
  },
  totaliser_current_value: {
    type: Number,
    default: 0,
  },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "deviceHistory";
let deviceHistorySchema = Schema(schema, schemaOption);

let deviceHistoryModel = model(modelName, deviceHistorySchema);
let deviceHistory = new SchemaModel(deviceHistoryModel);

export default deviceHistory;
