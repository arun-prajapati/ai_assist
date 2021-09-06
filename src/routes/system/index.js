import { Router } from "express";
import ManageRoutes from "./manage";
import DeviceRoutes from "./device";
const routes = new Router();

const PATH = {
  ROOT: "/",
  MANAGE: "/manage",
  DEVICE: "/device",
};

routes.use(PATH.MANAGE, ManageRoutes);
routes.use(PATH.DEVICE, DeviceRoutes);

export default routes;
