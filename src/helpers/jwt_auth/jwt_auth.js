import jwt from "jsonwebtoken";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRATION = {
  expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
};
const REFRESH_TOKEN_EXPIRATION = {
  expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
};

export const createTokens = async (payload) => {
  const accessToken = jwt.sign(
    payload,
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRATION
  );

  const refreshToken = jwt.sign(
    payload,
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRATION
  );

  let tokens = { accessToken, refreshToken };
  return tokens;
};

export const verifyAccessToken = async (accessToken) => {
  const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
  return decoded;
};

export const verifyRefreshToken = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  return decoded;
};
