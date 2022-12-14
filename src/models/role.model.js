// const mongoose = require("mongoose");
import { Schema, model } from "mongoose";
import SchemaModel from "../config/database/mongoDBOperation";

const schema = {
  title: {
    type: String,
    trim: true,
  },
  slug: {
    type: String,
  },
  description: {
    type: String,
  },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "Roles";
let roleSchema = Schema(schema, schemaOption);

let roleModel = model(modelName, roleSchema);
let Roles = new SchemaModel(roleModel);

export default Roles;
