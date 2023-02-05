import mongoose from "mongoose";
import { logger, level } from "../../config/logger/logger";
import { defaultUserData } from "../../services/user/user.service";
const URL ="mongodb+srv://AI:9BpiAocfTXzKmj69@cluster0.nm7flpt.mongodb.net/?retryWrites=true&w=majority";
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
    mongoose.set('debug', true)
  } catch (e) {
    logger.log(level.error, `connection error ${e}`);
  }
})();

const db = mongoose.connection;
// initialize(db);
db.once(OPEN_EVENT, async () => {
  logger.log(level.info, `✔ Successfully connected to mongodb database`);
  
  // await defaultUserData();
});
db.on(ERROR_EVENT, () => {
  logger.log(level.error, `connection error while connection at ${URL}`);
});
