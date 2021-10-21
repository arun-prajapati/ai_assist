import { Schema, model } from "mongoose";
import SchemaModel from "../..../../config/database/mongoDBOperation";
const schema = {
  name: {
    type: String,
    trim: true,
    required: true,
  },
  pmac: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  vmac: {
    type: String,
    trim: true,
    required: true,
    unique: true,
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
    default: "auto",
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
    default: 0,
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
  pumpVersion: {
    type: String,
    default: "0.0.0",
  },
  valveVersion: {
    type: String,
    default: "0.0.0",
  },
  payloadInterval: {
    type: Number,
    default: 10,
  },
  typeOfSchedule: {
    type: String,
    enum: ["d", "w", "m", "y"],
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  startTime: String,
  endTime: String,
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
  pumpDuration: {
    type: String,
    default: "0000",
  },
  url: {
    type: String,
  },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Devices";
let deviceSchema = Schema(schema, schemaOption);

let deviceModel = model(modelName, deviceSchema);
let Devices = new SchemaModel(deviceModel);

export default Devices;
