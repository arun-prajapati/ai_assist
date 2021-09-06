import bcrypt from "bcryptjs";
import qs from "qs";

export const encrypt = async (data) => {
  const salt = await bcrypt.genSalt(10);
  let mystr = await bcrypt.hash(data, salt);
  return mystr;
};

export const decrypt = async (data, hashData) => {
  const match = await bcrypt.compare(data, hashData);
  return match;
};

export const standardStructureStringToJson = (queryString) => {
  return qs.parse(queryString);
};

export const standardStructureJsonToString = (standardJson) => {
  return qs.stringify(standardJson);
};

export const handleResponse = (res, dataObject, statusCode = 200) => {
  const { message, count, data } = dataObject;
  res.status(statusCode).json({
    error: false,
    statusCode,
    message,
    count,
    data,
  });
};

export const createResponse = (message, data = {}, count = 0) => {
  let response = {
    message,
    count,
    data,
  };

  return response;
};
export const databaseparser = (data) => {
  return data["message"]["errors"][0]["message"];
};

export const matchDatePattern = (datePattern) => {
  let dateRegexFormat =
    /^([myd]-(19|2[0-9])[0-9]{2})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/gm;
  let matchDateFilter = datePattern.match(dateRegexFormat);
  if (!matchDateFilter) return false;
  return true;
};

export const getDateFilter = (datePattern) => {
  // period => m: month, y:year, d:day
  let [period, yy, mm, dd] = datePattern.split("-");
  let dateFilter = {
    period,
    yy: parseInt(yy),
    mm: parseInt(mm),
    dd: parseInt(dd),
  };
  return dateFilter;
};

export const checkLeapYear = (year) => {
  const isLeapYear = year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
  return isLeapYear;
};
