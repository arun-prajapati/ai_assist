import { Router } from "express";
import PumpRoutes from "./pump.routes";

const routes = new Router();

const PATH = {
  ROOT: "/",
  PUMP: "/pump",
};

routes.use(PATH.PUMP, PumpRoutes);

export default routes;
