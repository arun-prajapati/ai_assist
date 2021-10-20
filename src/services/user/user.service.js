import Users from "../../models/user.model";
import { encrypt, decrypt } from "../../helpers/utility";
import { logger, level } from "../../config/logger/logger";
export const defaultUserData = async () => {
  logger.log(level.info, `>> Services:  default UserData function`);
  try {
    if (process.env.DEFAULT_EMAIL && process.env.DEFAULT_PASSWORD) {
      let isEmailExist = await Users.findOneDocument({
        email: process.env.DEFAULT_EMAIL,
      });
      if (!isEmailExist) {
        let hashPassword = await encrypt(process.env.DEFAULT_PASSWORD);
        let defaultData = {
          name: process.env.DEFAULT_NAME,
          email: process.env.DEFAULT_EMAIL,
          password: hashPassword,
        };
        await Users.createData(defaultData);
        logger.log(level.info, `>> Default data added successfully`);
      } else {
        logger.log(level.info, `<<  default user Data: No default data added`);
      }
    } else {
      logger.log(level.info, `<< default user Data : No default data added`);
    }
  } catch (error) {
    logger.log(level.info, `<< default user Data : No default data added`);
  }
};
export const userDataVerify = async (userData, body) => {
  logger.log(level.info, `>> Service: userDataVerify()`);
  let { password } = body;
  if (!userData) throw new Error("Invalid email or password");
  let isPasswordMatch = await decrypt(password, userData.password);
  if (!isPasswordMatch) throw new Error("Invalid email or password");
};
