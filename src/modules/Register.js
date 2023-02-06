const userPasswordValidator = require("../helpers/userPasswordValidator");
const { hashPassword } = require("../helpers/encryption");
const { generateRandKey } = require("../helpers/common");
var crypto = require("crypto");
const { create, findByIndex } = require("../helpers/dynamo");

const Register = async ({ email, firstName, lastName, password, recaptcha }) => {
  if (!email || !password || !firstName || !lastName) {
    throw new Error("Empty params.");
  }

  const passDecoded = decodeURIComponent(password.trim());
  const { isValid, error } = userPasswordValidator(passDecoded);

  if (!isValid) throw new Error(error);

  email = decodeURIComponent(email.toLowerCase().trim());
  const hashedPasswd = await hashPassword(passDecoded);
  const verifyKey = generateRandKey();

  var id = crypto.randomBytes(20).toString("hex");
  const key = id;
  const sk = `CUSTOMER#EMAIL#${firstName || ""}#${lastName || ""}`
  const customerData = {
    pk: key,
    sk,
    email,
    firstName,
    lastName,
    password: hashedPasswd,
    createdDate: new Date().toISOString(),
    verifyKey,
    dpa: true,
    gs1pk: pk,
    gs1sk: sk,
  };

  const duplicateCust = await findByIndex({ indexName: "email-index", query: { email } });
  if (duplicateCust.Count > 0) {
    throw new Error(`${email} email is already registered.`);
  }

  await create({ item: customerData });
  return { success: true, customer: customerData };
};

module.exports = Register;
