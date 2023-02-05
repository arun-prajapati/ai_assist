import { Schema, model } from "mongoose";
import SchemaModel from "../config/database/mongoDBOperation";
const schema = {
  first_name: String,
  last_name:String,
  email:String,
  password: {
    type: String,
  },
  mobile_no: String,
  gender: String,
  DOB: Date,
  provider:String
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
