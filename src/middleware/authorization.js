// import { ForbiddenError } from "../helpers/errors/custom-error";
// import { rolePermissions } from "../services/system/manage/permission.service";
// import { CONSTANTS as HTTP_METHOD } from "../constants/httpMethod";

// const CURRENT_USER = "currentUser";
// const PERMISSION_TYPE = "ptype";

// export const AuthorizationMiddleware = async (req, res, next) => {
//   const currentUser = req[CURRENT_USER];
//   const permissionType = req.headers[PERMISSION_TYPE];
//   const httpMethod = req.method;
//   const { roleTitle, roleId } = currentUser;
//   try {
//     if (roleTitle === process.env.DEFAULT_ROLE_TYPE) return next();
//     let rolefilter = { roleId };
//     const permissions = await rolePermissions(rolefilter);
//     if (permissions && permissions.length > 0) {
//       let currentPermission = filterCurrentPermission(
//         permissions,
//         permissionType
//       );
//       isHavePermission(httpMethod, currentPermission);
//       return next();
//     }
//   } catch (error) {
//     return next(new ForbiddenError());
//   }

//   return next(new ForbiddenError());
// };

// const filterCurrentPermission = (permissions, permissionType) => {
//   // get requested permission from permissions array if not found throw error
//   let currentPermission = permissions.find(
//     (permissionDoc) => permissionDoc.permission.slug === permissionType
//   );

//   if (!currentPermission) throw new Error();
//   return currentPermission;
// };

// const isHavePermission = (method, currentPermission) => {
//   let { add, read, edit, remove, patch /*access */ } = currentPermission;
//   let isPermissionGranted = false;
//   switch (method) {
//     case HTTP_METHOD.GET:
//       isPermissionGranted = read ? true : false;
//       break;

//     case HTTP_METHOD.POST:
//       isPermissionGranted = add ? true : false;
//       break;

//     case HTTP_METHOD.PATCH:
//       isPermissionGranted = patch ? true : false;
//       break;

//     case HTTP_METHOD.PUT:
//       isPermissionGranted = edit ? true : false;
//       break;

//     case HTTP_METHOD.DELETE:
//       isPermissionGranted = remove ? true : false;
//       break;

//     default:
//       break;
//   }
//   if (!isPermissionGranted) throw new Error();
//   return isPermissionGranted;
// };
