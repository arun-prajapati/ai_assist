import { Router } from "express";
import { handleResponse } from "../helpers/utility";
import SystemRoutes from "./system";
import RoleRoutes from "./role";
import UserRoutes from "./user";
import SubjectRoutes from "./subject";
import TopicRoutes from "./topic";
import CardRoutes from "./card";
import TestresultRoutes from "./testresult";
import TestqaRoutes from "./testqa";
const routes = new Router();
const PATH = {
  ROOT: "/",
  SYSTEM: "/sys",
  USER: "/users",
  ROLES: "/roles",
  SUBJECT:"/subject",
  TOPIC:"/topic",
  CARD:"/card",
  TESTRESULT:"/testresult",
  TESTQA:"/testqa"
};

routes.get("/healthCheck", (req, res) => {
  let dataObject = {
    message: "Server is running fine",
  };
  return handleResponse(res, dataObject);
});

routes.use(PATH.SYSTEM, SystemRoutes);
routes.use(PATH.USER, UserRoutes);
routes.use(PATH.ROLES, RoleRoutes);
routes.use(PATH.SUBJECT, SubjectRoutes);
routes.use(PATH.TOPIC, TopicRoutes);
routes.use(PATH.CARD, CardRoutes);
routes.use(PATH.TESTRESULT, TestresultRoutes);
routes.use(PATH.TESTQA, TestqaRoutes);

export default routes;
