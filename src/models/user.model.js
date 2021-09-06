import { Schema, model } from "mongoose";
import SchemaModel from "../..../../config/database/mongoDBOperation";
const schema = {
  email: {
    type: String,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    trim: true,
    required: true,
  },
};

let schemaOption = {
  timestamps: true,
  versionKey: false,
};

let modelName = "User";
let userSchema = Schema(schema, schemaOption);

let userModel = model(modelName, userSchema);
let Users = new SchemaModel(userModel);

export default Users;
