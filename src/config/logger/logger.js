import winstonLogger from "./winston";

const ERROR = "error";
const WARN = "warn";
const INFO = "info";
const VERBOSE = "verbose";
const DEBUG = "debug";
const SILLY = "silly";

export const logger = {
  log: (log_level, message) => {
    switch (log_level) {
      case log_level:
        winstonLogger.log({ level: log_level, message: message });
        break;
      default:
        winstonLogger.log({
          level: INFO,
          message: message,
        });
        break;
    }
  },
};

export const level = {
  error: ERROR,
  warn: WARN,
  info: INFO,
  verbose: VERBOSE,
  debug: DEBUG,
  silly: SILLY,
};
export default logger;
