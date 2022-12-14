import app from "./app";
import "./config/database/mongodb";
// import "./mqtt/pubSub";
// import "./cron-jobs";

import { logger, level } from "./config/logger/logger";

const PORT = process.env.PORT || 8000;

app.listen(PORT, async (err) => {
  if (err) {
    logger.log(level.error, `Cannot run due to ${err}!`);
  } else {
    logger.log(level.info, `✔ Server running on port ${PORT}`);
  }
});
