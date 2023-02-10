import { Router } from "express";
import * as StudyCtrl from "../../controller/study/study.controller";
// import * as ErrorMiddleware from "../../../middleware/validatorError";
// import { validate as DeviceValidate } from "../../../validator/system/device/device.validator";
// import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
// import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
  GET_STUDY_RESULT:"/getstudyresult",
  SINGLE_STUDY_RESULT_OPERATION:"/studyopertion/:studyId"
};
routes.route(PATH.ROOT).post(StudyCtrl.createStudy);
routes.route(PATH.GET_STUDY_RESULT).post(StudyCtrl.getStudyResult);
routes.route(PATH.SINGLE_STUDY_RESULT_OPERATION).put(StudyCtrl.updateStudy);
export default routes;
