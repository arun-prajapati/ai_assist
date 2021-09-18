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

export const getHAXValue = (no, value) => {
  let number = value;
  let hexStr = number.toString(16).toUpperCase().padStart(no, "0");
  return hexStr;
};

export const getMINPadvalue = (value) => {
  value = value.toString();
  let hexStr = value.padStart(4, "0");
  return hexStr;
};

export const getDecimalValue = (haxValue) => {
  // haxValue = '0000001E';
  let decimalValue = parseInt(haxValue, 16);
  return decimalValue;
};

export const filterMac = (macId) => {
  let MAC = macId.split(":").join("");
  return MAC;
};

export const flowCoversion = (flowValue, flowUnit) => {
  console.log(">>", flowValue, flowUnit);
  let Flow = 0;
  switch (flowUnit) {
    case "m3/s": {
      Flow = flowValue * 6000;
      break;
    }
    case "m3/m": {
      Flow = flowValue * 1000;
      break;
    }
    case "m3/h": {
      Flow = flowValue * 16.67;
      break;
    }
    case "Lt/m": {
      Flow = flowValue;
      break;
    }
    case "Lt/s": {
      Flow = flowValue * 60;
      break;
    }
    case "Lt/h": {
      Flow = flowValue * 0.01667;
      break;
    }
    case "hL/m": {
      Flow = flowValue * 100;
      break;
    }
    case "hL/h": {
      Flow = flowValue * 1.666666667;
      break;
    }
    case "dL/s": {
      Flow = flowValue * 6;
      break;
    }
    case "dL/m": {
      Flow = flowValue / 0.1;
      break;
    }
  }
  return Flow;
};
