import { Router } from "express";
// import ManageRoutes from "./manage";
import DeviceRoutes from "./device";
import DashboardRoutes from "./Dashboard";
const routes = new Router();

const PATH = {
  ROOT: "/",
  // MANAGE: "/manage",
  DEVICE: "/device",
  DASHBOARD: "/dashboard",
};

// routes.use(PATH.MANAGE, ManageRoutes);
routes.use(PATH.DASHBOARD, DashboardRoutes);
routes.use(PATH.DEVICE, DeviceRoutes);

export default routes;