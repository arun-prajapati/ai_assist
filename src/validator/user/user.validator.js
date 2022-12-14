import { body, param } from "express-validator";
import { CONSTANTS as USER_CONSTANTS } from "../../constants/user/user";
import Users from "../../models/user.model";
export const validate = (method) => {
  let error = [];
  switch (method) {
    case USER_CONSTANTS.CREATE_USER: {
      error = [
        body("Name", "Name should be valid")
          .not()
          .isEmpty()
          .trim()
          .isLength({ min: 2, max: 20 }),
        body("userName", "Invalid userName")
          .not()
          .isEmpty()
          // .isEmail()
          .toLowerCase()
          .custom(verifyEmailId),
        body("password", "Password should not be empty").not().isEmpty(),
        body("mobile_no", "mobile_no should be valid")
          .not()
          .isEmpty()
          .trim()
          .isLength({ min: 10, max: 10 })
          .isNumeric(),
        body("Address", "Address should be valid").not().isEmpty(),
        body("adharcard", "aadharcard should be valid")
          .not()
          .isEmpty()
          .optional()
          .trim()
          .isLength({ min: 12, max: 12 })
          .isNumeric(),
        body("licenseno", "licenseno should be valid")
          .not()
          .isEmpty()
          .trim()
          .optional()
          // .isLength({ min: 15, max: 15 })
          .isAlphanumeric(),
        body("gender", "gender should be valid")
          .not()
          .isEmpty()
          .trim()
          .isLength({ min: 4, max: 10 })
          .isAlpha(),
        body("DOB", "DOB should be valid").not().isEmpty().trim().isDate(),
      ];
      break;
    }
    case USER_CONSTANTS.LOGIN_USER: {
      // error = [
      //   body("email", "Invalid Email").not().isEmpty().isEmail(),
      //   body("password", "Password should not be empty").not().isEmpty(),
      // ];
      break;
    }
    case USER_CONSTANTS.REMOVE_SINGLE_USER: {
      error = [param("userId").custom(userExist)];
      break;
    }
    case USER_CONSTANTS.GET_SINGLE_USER: {
      error = [param("userId").custom(userExist)];
      break;
    }
    case USER_CONSTANTS.UPDATE_SINGLE_USER: {
      error = [param("userId").custom(userExist)];
      break;
    }
    case USER_CONSTANTS.FORGOT_PASSWORD: {
      error = [body("email", "Invalid Email").not().isEmpty().isEmail()];
      break;
    }
  }
  return error;
};

export const verifyEmailId = async (value) => {
  let emailExist = await Users.findOneDocument({ userName: value });
  if (emailExist) throw new Error("This userName already exist");
  return true;
};

export const verifyValueEmailId = async (value) => {
  let emailExist = await Users.findOneDocument({ email: value });
  const emailRegexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (emailRegexp.test(emailExist)) return value;
};

export const userExist = async (value) => {
  let userExist = await Users.findOneDocument({ _id: value });
  if (!userExist) throw new Error("This user does not exist");
  return value;
};
