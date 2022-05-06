import app from "./app";
import "./config/database/mongodb";
import "./mqtt/pubSub";
import "./cron-jobs";

import { logger, level } from "./config/logger/logger";
const cluster = require("cluster");
const totalCPUs = require("os").cpus().length;
const PORT = process.env.PORT || 8000;
if (cluster.isMaster) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    console.log(`Worker ${process.pid} started`);
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Let's fork another worker!");
    cluster.fork();
  });
} else {
  app.listen(PORT, async (err) => {
    if (err) {
      logger.log(level.error, `Cannot run due to ${err}!`);
    } else {
      logger.log(level.info, `✔ Server running on port ${PORT}`);
    }
  });
}
