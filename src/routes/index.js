import { Router } from "express";
import SystemRoutes from "./system";

const routes = new Router();
const PATH = {
  ROOT: "/",
  SYSTEM: "/sys",
};

routes.use(PATH.SYSTEM, SystemRoutes);

export default routes;
