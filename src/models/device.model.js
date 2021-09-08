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
  pumpCurrentstate: {
    type: Boolean,
    default: false,
  },
  pumpLastUpdated: {
    type: Date,
  },
  valveCurrentstate: {
    type: Boolean,
    default: false,
  },
  valveLastUpdated: {
    type: Date,
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

let modelName = "Device";
let deviceSchema = Schema(schema, schemaOption);

let deviceModel = model(modelName, deviceSchema);
let Devices = new SchemaModel(deviceModel);

export default Devices;
