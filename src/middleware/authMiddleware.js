import {
  TokenExpiredError,
  UnauthorizationError,
} from "../helpers/errors/custom-error";
import * as JWT from "../helpers/jwt_auth/jwt_auth";
//import { Roles /*Users*/ } from "../models/index";
import Users from "../models/user.model";
import { CONSTANTS as USER_STATUS } from "../constants/status/userStatus";
import * as UserSrv from "../services/user/user.service";

const AUTH_TYPE = "bearer";
const tokenLength = 2;
const tokenSplitBy = " ";
const AUTHORIZATION_HEADER_NAME = "authorization";
const CURRENT_USER = "currentUser";

export const AuthMiddleware = async (req, res, next) => {
  const authorization = req.headers[AUTHORIZATION_HEADER_NAME];
  try {
    if (authorization) {
      let token = authorization.split(tokenSplitBy);
      if (token.length == tokenLength && token[0].toLowerCase() === AUTH_TYPE) {
        let accessToken = token[1];
        let decoded = await JWT.verifyAccessToken(accessToken);
        let { id } = decoded;

        let filter = {
          where: { id },
          attributes: { exclude: ["password", "createdAt", "updatedAt"] },
          include: [
            {
              model: Roles,
              as: "role",
              attributes: ["title"],
            },
          ],
        };
        await Users.findOneDocument({ _id });
        let userData = await UserSrv.userData(filter);

        if (userData && userData.status === USER_STATUS.ACTIVE) {
          let userReqData = createUserRequestData(userData);

          req[CURRENT_USER] = userReqData;
          return next();
        }
      }
    }
  } catch (error) {
    return next(new TokenExpiredError());
  }
  return next(new UnauthorizationError());
};

const createUserRequestData = (userData) => {
  let {
    id,
    roleId,
    status,
    email,
    role: {
      dataValues: { title },
    },
  } = userData;

  let userRequestObject = {
    id,
    roleId,
    roleTitle: title,
    status,
    email,
  };

  return userRequestObject;
};
