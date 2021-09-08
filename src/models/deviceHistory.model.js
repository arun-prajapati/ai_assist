import { Schema, model } from "mongoose";
import SchemaModel from "../..../../config/database/mongoDBOperation";
const schema = {
  name: {
    type: String,
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

let modelName = "deviceHistory";
let deviceHistorySchema = Schema(schema, schemaOption);

let deviceHistoryModel = model(modelName, deviceHistorySchema);
let deviceHistory = new SchemaModel(deviceHistoryModel);

export default deviceHistory;
