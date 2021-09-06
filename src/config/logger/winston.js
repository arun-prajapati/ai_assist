/**
 * Create the winston logger instance
 */

import { createLogger, format, transports } from "winston";
// import { constants as APP_CONST } from "../constants/application";
const { combine, timestamp, label, printf, colorize } = format;

// TO-DO create separate file for constant if need to add more constant
// const LOG_LABEL = 'UBER_LOGS';
const LOG_LABEL = "RMS_LOGS";
const LOG_TIMEZONE = "Asia/Kolkata";
const LOCALE = "en-US";
const ERROR_LOG_FILE = "error.log";
const COMBINED_LOG_FILE = "combined.log";
const ERROR_LOG_LEVEL = "error";
const DEBUG_LOG_LEVEL = "debug";
const IS_PROD = process.env.NODE_ENV == "production" ? true : false;

const timezoned = () => {
  return new Date().toLocaleString(LOCALE, {
    timeZone: LOG_TIMEZONE,
  });
};

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const combineFormat = combine(
  label({ label: LOG_LABEL }),
  timestamp({ format: timezoned }),
  colorize(true),
  customFormat
);

const logger = createLogger({
  format: combineFormat,
  transports: [
    new transports.File({
      filename: ERROR_LOG_FILE,
      level: ERROR_LOG_LEVEL,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new transports.File({
      filename: COMBINED_LOG_FILE,
      level: DEBUG_LOG_LEVEL,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (!IS_PROD || IS_PROD) {
  logger.add(
    new transports.Console({
      format: combineFormat,
      level: DEBUG_LOG_LEVEL,
    })
  );
}

export default logger;
