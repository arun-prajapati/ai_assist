import { body, param } from "express-validator";
import { CONSTANTS as ROLE_CONSTANTS } from "../../constants/role/role";
const mongoose = require("mongoose");
import Roles from "../../models/role.model";
export const validate = (method) => {
  let error = [];
  switch (method) {
    case ROLE_CONSTANTS.CREATE_ROLE: {
      error = [
        body("title", "Title should not be empty").not().isEmpty().trim().isLength({ min: 2, max: 70 }),
        body("slug", "Slug should not be empty").not().isEmpty().trim().isLength({ min: 2, max: 70 }),
        body("description", "Description should not be empty").not().isEmpty().isLength({ min: 2, max: 255 }),
        body().custom(isRoleValue)
      ];
      break;
    }
    case ROLE_CONSTANTS.GET_SINGLE_ROLE: {
      error = [param("roleId").custom(roleExist)];
      break;
    }
  }
  return error;
};

export const roleExist = async (value) => {
  console.log("value", value);
  let roleExist = await Roles.findOneDocument({
    _id: mongoose.Types.ObjectId(value),
  });
  console.log("value", roleExist);
  if (!roleExist) throw new Error("This Role does not exist");
  return value;
};

export const isRoleValue = async (value) => {
  console.log("value", value);
  let titleExist = await Roles.findOneDocument({ title: value.title });
  if (titleExist) throw new Error("This Role title already exist");

  let slugExist = await Roles.findOneDocument({ slug: value.slug });
  if (slugExist) throw new Error("This Role slug already exist");

  let descriptionExist = await Roles.findOneDocument({ description: value.description });
  if (descriptionExist) throw new Error("This Role description already exist");
  return value;
};
