import { Router } from "express";
import * as TopicCtrl from "../../controller/topic/topic.controller";
// import * as ErrorMiddleware from "../../../middleware/validatorError";
// import { validate as DeviceValidate } from "../../../validator/system/device/device.validator";
// import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
// import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
  GET_ALL_TOPICS:"/getalltopics",
  SINGLE_TOPIC_OPERATION:"/topicopertion/:topicId"
};
routes.route(PATH.ROOT).post(TopicCtrl.createTopic);
routes.route(PATH.GET_ALL_TOPICS).post(TopicCtrl.getTopics);
routes.route(PATH.SINGLE_TOPIC_OPERATION).get(TopicCtrl.getSingleTopic);
routes.route(PATH.SINGLE_TOPIC_OPERATION).delete(TopicCtrl.removeSingleTopic);
routes.route(PATH.SINGLE_TOPIC_OPERATION).put(TopicCtrl.updateTopic);
export default routes;
