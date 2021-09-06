import mongoose from "mongoose";
import { logger, level } from "../../config/logger/logger";

const URL = process.env.MONGO_URL;
const OPEN_EVENT = "open";
const ERROR_EVENT = "error";

(async () => {
  try {
    await mongoose.connect(URL, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });
  } catch (e) {
    logger.log(level.error, `connection error ${e}`);
  }
})();

const db = mongoose.connection;
// initialize(db);
db.once(OPEN_EVENT, () => {
  logger.log(level.info, `✔ Successfully connected to mongodb database`);
});
db.on(ERROR_EVENT, () => {
  logger.log(level.error, `connection error while connection at ${URL}`);
});