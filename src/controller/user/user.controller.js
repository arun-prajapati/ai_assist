import {
  BadRequestError,
  InternalServerError,
  //UnauthorizationError,
} from "../../helpers/errors/custom-error";
import Users from "../../models/user.model";
import Tokens from "../../models/token.model";
import { handleResponse } from "../../helpers/utility";
import { logger, level } from "../../config/logger/logger";
import * as Usersrv from "../../services/user/user.service";
import { createTokens } from "../../helpers/jwt_auth/jwt_auth";

export const userLogin = async (req, res, next) => {
  logger.log(level.info, `>> Controller: userLogin()`);
  let body = req.body;
  try {
    let userData = await Users.findOneDocument({ email: req.body.email });
    await Usersrv.userDataVerify(userData, body);
    let payload = {
      _id: userData._id,
      email: userData.email,
    };
    let tokens = await createTokens(payload);
    let refreshTokenData = {
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      userId: userData._id,
    };
    Tokens.createData(refreshTokenData);
    let dataObject = {
      message: "You have logged in successfully.",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: userData._id,
        email: userData.email,
        name: userData.name,
      },
    };
    return handleResponse(res, dataObject);
  } catch (e) {
    if (e && e.message) return next(new BadRequestError(e.message));
    logger.log(level.error, `Error: ${JSON.stringify(e)}`);
    return next(new InternalServerError());
  }
};
