import { Schema, model } from "mongoose";
import SchemaModel from "../config/database/mongoDBOperation";
const schema = {
  Name: String,
  userName:String,
  password: {
    type: String,
  },
  mobile_no: Number,
  Address: String,
  adharcard: String,
  licenseno: String,
  gender: String,
  DOB: Date,
  roleId: { type: Schema.Types.ObjectId, ref: "Roles" },
  wardId: { type: Schema.Types.ObjectId, ref: "Ward" },
  nagarparlikaId: { type: Schema.Types.ObjectId, ref: "Nagarpalika" },
  otp_counter: {
    type: Number,
    default: 0,
  },
  last_otp_time: {
    type: Date,
    // default: new Date(),
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
