import Roles from "../../models/role.model";
// import Tabs from "../../models/tabs.model";
// import Rolespermission from "../../models/roles_permission.model";
import { handleResponse } from "../../helpers/utility";
const mongoose = require("mongoose");
import {
  BadRequestError,
  InternalServerError,
  // handleError,
} from "../../helpers/errors/custom-error";
import { logger, level } from "../../config/logger/logger";

export const addRole = async (req, res, next) => {
  logger.log(level.info, `✔ Controller addRole()`);
  try {
    let roleData = await Roles.createData(req.body);
    // let tabsData = await Tabs.findData({});
    // for (let i = 0; i < tabsData.length; i++) {
    //   await Rolespermission.createData({
    //     roleId: roleData._id,
    //     tabId: tabsData[i]._id,
    //   });
    // }
    let dataObject = { message: "Role created succesfully" };
    return handleResponse(res, dataObject, 201);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const viewRole = async (req, res, next) => {
  try {
    logger.log(level.info, `✔ Controller viewRole()`);
    // const query = { _id: req.body.id };
    const roleData = await Roles.findData({
      _id: { $ne: mongoose.Types.ObjectId("6215dc2ab9dcbf49b86de4bf") },
    });
    let dataObject = {
      count: roleData.length,
      message: "roles fetched successfully.",
      data: roleData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const viewSingleRole = async (req, res, next) => {
  try {
    logger.log(level.info, `✔ Controller viewSingleRole()`);
    const roleData = await Roles.findOneDocument({
      _id: mongoose.Types.ObjectId(req.params.roleId),
    });
    let dataObject = {
      message: "role fetched successfully.",
      data: roleData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};

export const updateSingleRole = async (req, res, next) => {
  try {
    logger.log(level.info, `✔ Controller updateSingleRole()`);
    let { title, slug, description } = req.body;
    let updateDeviceObject = {
      title,
      slug,
      description,
    };
    let roleData = await Roles.updateData(
      { _id: mongoose.Types.ObjectId(req.params.roleId) },
      updateDeviceObject
    );
    let dataObject = {
      message: "role details updated successfully.",
      data: roleData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
export const removeSingleRole = async (req, res, next) => {
  try {
    logger.log(level.info, `✔ Controller removeSingleRole()`);

    const query = { _id: req.params.roleId };
    await Rolespermission.deleteMultipleData({ roleId: req.params.roleId });
    /*let removedData =*/ await Roles.deleteData(query);
    let dataObject = {
      message: "role deleted successfully.",
      // data: removedData,
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
