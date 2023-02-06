const config = require("./config");
const { sign, verify } = require("jsonwebtoken");
const nodeUtil = require("util");

const { TokenSecret } = config;


const generateRandKey = () => {
  return Math.random().toString().substring(2, 8);
};

const generateToken = async ({ data, expiresIn }) => {
  const jSign = nodeUtil.promisify(sign);

  let opts = {};
  if (expiresIn) {
    opts = {
      expiresIn,
    };
  }

  console.log({ TokenSecret });

  try {
    const token = await jSign(data, TokenSecret, opts);
    return token;
  } catch (err) {
    throw err;
  }
};

const generateTokens = async ({ customer }) => {
  try {
    const { pk, sk, firstName, lastName, email, mobile, socialId, socialFlag, dpa, marketing, datalabs } = customer;
    const filteredUser = {
      pk,
      sk,
      firstName,
      lastName,
      email,
      mobile,
      socialId,
      socialFlag,
      dpa,
      marketing,
      datalabs,
    };
    const refreshToken = await generateToken({ data: filteredUser });
    const accessToken = await generateToken({ data: filteredUser });
    return { refreshToken, accessToken };
  } catch (err) {
    return err;
  }
};

const verifyToken = async (token) => {
  try {
    return verify(token, TokenSecret);
  } catch (err) {
    console.log("verify token error::", err);
    return {};
  }
};

const getAuthorizationToken = async (headers) => {
  const { Authorization } = headers;
  const token = Authorization.split(" ")[1];
  return token;
};

module.exports = { generateRandKey, generateTokens, verifyToken, getAuthorizationToken };
