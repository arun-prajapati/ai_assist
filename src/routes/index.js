import { Router } from "express";
import SystemRoutes from "./system";
import UserRoutes from "./user";
const routes = new Router();
const PATH = {
  ROOT: "/",
  SYSTEM: "/sys",
  USER: "/users",
};

routes.use(PATH.SYSTEM, SystemRoutes);
routes.use(PATH.USER, UserRoutes);

export default routes;
