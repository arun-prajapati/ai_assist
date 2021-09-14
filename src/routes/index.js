import { Router } from "express";
import { handleResponse } from "../helpers/utility";
import SystemRoutes from "./system";
import UserRoutes from "./user";
const routes = new Router();
const PATH = {
  ROOT: "/",
  SYSTEM: "/sys",
  USER: "/users",
};

routes.get("/healthCheck", (req, res) => {
  let dataObject = {
    message: "Server is running",
  };
  return handleResponse(res, dataObject);
});

routes.use(PATH.SYSTEM, SystemRoutes);
routes.use(PATH.USER, UserRoutes);

export default routes;
