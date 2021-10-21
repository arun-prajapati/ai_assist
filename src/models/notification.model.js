import { Schema, model } from "mongoose";
const mongoose = require("mongoose");
import SchemaModel from "../..../../config/database/mongoDBOperation";
const schema = {
  siteId: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Devices",
    trim: true,
  },
  receiverEmail: {
    type: [String],
  },
};
let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Notification";
let notificationSchema = Schema(schema, schemaOption);

let notificationModel = model(modelName, notificationSchema);
let Notifications = new SchemaModel(notificationModel);

export default Notifications;
