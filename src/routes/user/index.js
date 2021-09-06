import { Router } from "express";
import * as UserCtrl from "../../controller/user/user.controller";
// import * as ErrorMiddleware from "../../middleware/validatorError";
// import { validate as UserValidate } from "../../validator/user/user.validator";
// import { CONSTANTS as USER_CONSTANTS } from "../../constants/user/user";
// import { AuthMiddleware } from "../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
  LOGIN: "/login",
};
routes.route(PATH.LOGIN).post(UserCtrl.userLogin);

export default routes;
