import { Router } from "express";
const usersCtrl = require("../../controller/user/user.controller");
import * as ErrorMiddleware from "../../middleware/validatorError";
import { validate as UserValidate } from "../../validator/user/user.validator";
import { CONSTANTS as USER_CONSTANTS } from "../../constants/user/user";
const routes = new Router();
const PATH = {
  ROOT: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  VERIFY_OTP: "/verifyOTP",
  FETCH_USER_ROLE_WISE: "/fetchuserrolewise",
  WEB_LOGIN: "/webLogin",
  UPDATE_USER: "/updateuser/:userId",
  OPERATION_USER: "/useroperation/:userId",
};
routes.route(PATH.ROOT).get(usersCtrl.getAllUser);
routes.route(PATH.FETCH_USER_ROLE_WISE).get(usersCtrl.getAllUserRoleWise);
// routes
//   .route(PATH.FORGOT_PASSWORD)
//   .post(
//     [
//       UserValidate(USER_CONSTANTS.FORGOT_PASSWORD),
//       ErrorMiddleware.ExpressValidatorError,
//     ],
//     usersCtrl.setPasswordResetLink
//   );
// routes.route(PATH.RESET_PASSWORD).post(usersCtrl.resetPassword);
routes
  .route(PATH.SIGNUP)
  .post(
    [
      UserValidate(USER_CONSTANTS.CREATE_USER),
      ErrorMiddleware.ExpressValidatorError,
    ],
    usersCtrl.register
  );

routes.route(PATH.LOGIN).post(
  [
    UserValidate(USER_CONSTANTS.LOGIN_USER),
    ErrorMiddleware.ExpressValidatorError,
  ],
  usersCtrl.login);
routes.route(PATH.VERIFY_OTP).post(usersCtrl.verifyOTP);
routes.route(PATH.UPDATE_USER).patch(
  [
    UserValidate(USER_CONSTANTS.UPDATE_SINGLE_USER),
    ErrorMiddleware.ExpressValidatorError,
  ], 
  usersCtrl.updateSingleUser);
routes
  .route(PATH.OPERATION_USER)
  .delete(
    [
      UserValidate(USER_CONSTANTS.REMOVE_SINGLE_USER),
      ErrorMiddleware.ExpressValidatorError,
    ],
    usersCtrl.removeSingleUser
  )
  .get(
    [
      UserValidate(USER_CONSTANTS.GET_SINGLE_USER),
      ErrorMiddleware.ExpressValidatorError,
    ],
    usersCtrl.getSingleUser
  );
//   .put(
//     [
//       UserValidate(USER_CONSTANTS.UPDATE_SINGLE_USER),
//       ErrorMiddleware.ExpressValidatorError,
//     ],
//     usersCtrl.updateSingleUser
//   );
routes.route(PATH.WEB_LOGIN).post(usersCtrl.weblogin);
export default routes;
