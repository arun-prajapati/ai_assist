import { Router } from "express";
import ManageRoutes from "./manage";


const routes = new Router();

const PATH = {
  ROOT: "/",
  MANAGE: "/manage",
};

routes.use(PATH.MANAGE, ManageRoutes);

export default routes;
