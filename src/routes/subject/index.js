import { Router } from "express";
import * as SubjectCtrl from "../../controller/subject/subject.controller";
// import * as ErrorMiddleware from "../../../middleware/validatorError";
// import { validate as DeviceValidate } from "../../../validator/system/device/device.validator";
// import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
// import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
  SINGLE_SUBJECT_OPERATION:"/subjectopertion/:subjectId"
};
routes.route(PATH.ROOT).post(SubjectCtrl.createSubject);
routes.route(PATH.ROOT).get(SubjectCtrl.getSubjects);
routes.route(PATH.SINGLE_SUBJECT_OPERATION).get(SubjectCtrl.getSingleSubject);
routes.route(PATH.SINGLE_SUBJECT_OPERATION).delete(SubjectCtrl.removeSingleSubject);
routes.route(PATH.SINGLE_SUBJECT_OPERATION).put(SubjectCtrl.updateSubject);
export default routes;
