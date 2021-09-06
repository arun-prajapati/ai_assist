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
  },
  vmac: {
    type: String,
    trim: true,
    required: true,
  },
  location: {
    type: String,
    trim: true,
    required: true,
  },
  pstate: {
    type: Number,
    min: 0,
    max: 2,
    default: 0,
  },
  vstate: {
    type: Number,
    min: 0,
    max: 2,
    default: 0,
  },
  operationMode: {
    type: String,
    enum: ["auto", "manual"],
    default: "manual",
  },
  threshold: {
    type: String,
    trim: true,
  },
  lineSize: {
    type: Number,
  },
  pipeSize: {
    type: Number,
  },
  typeOfSchedule: {
    type: String,
    enum: ["d", "w", "m", "y"],
  },
  startDate: {
    type: Date,
    trim: true,
  },
  endDate: {
    type: Date,
    trim: true,
  },
  pumpCurrentstate: {
    type: Boolean,
  },
  pumpLastUpdated: {
    type: Date,
    trim: true,
  },
  valveCurrentstate: {
    type: Boolean,
    trim: true,
  },
  valveLastUpdated: {
    type: Date,
    trim: true,
  },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Device";
let deviceSchema = Schema(schema, schemaOption);

let deviceModel = model(modelName, deviceSchema);
let Devices = new SchemaModel(deviceModel);

export default Devices;
