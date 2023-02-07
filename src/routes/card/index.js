import { Router } from "express";
import * as CardCtrl from "../../controller/card/card.controller";
// import * as ErrorMiddleware from "../../../middleware/validatorError";
// import { validate as DeviceValidate } from "../../../validator/system/device/device.validator";
// import { CONSTANTS as SYSTEM_CONSTANTS } from "../../../constants/system/system";
// import { AuthMiddleware } from "../../../middleware/authMiddleware";
const routes = new Router();
const PATH = {
  ROOT: "/",
  GET_ALL_CARDS:"/getallcards",
  SINGLE_CARD_OPERATION:"/cardopertion/:cardId"
};
routes.route(PATH.ROOT).post(CardCtrl.createCard);
routes.route(PATH.GET_ALL_CARDS).post(CardCtrl.getCards);
routes.route(PATH.SINGLE_CARD_OPERATION).get(CardCtrl.getSingleCard);
routes.route(PATH.SINGLE_CARD_OPERATION).delete(CardCtrl.removeSingleCard);
routes.route(PATH.SINGLE_CARD_OPERATION).put(CardCtrl.updateCard);
export default routes;
