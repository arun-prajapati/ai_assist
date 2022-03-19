import morgan from "morgan";
import cors from "cors";
import express from "express";
import ApiRoutes from "./routes";
import { handleError, NotFoundError } from "./helpers/errors/custom-error";

const app = express();
const MORGAN_DEV_FORMAT = "dev";

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan(MORGAN_DEV_FORMAT));
app.set("view engine", "ejs");
const PATH = {
  API: "/api/v1",
};

app.use(PATH.API, ApiRoutes);

app.all("*", (_req, _res) => {
  throw new NotFoundError();
});
app.use((err, req, res, _next) => {
  handleError(err, res);
});

export default app;
