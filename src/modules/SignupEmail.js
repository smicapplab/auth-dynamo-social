const { generateRandKey } = require("../helpers/common");
var crypto = require("crypto");
const { create, updateOne, findByIndex } = require("../helpers/dynamo");
const { hashPassword } = require("../helpers/encryption");
const { sendVerificationEmail } = require("../helpers/email/VerificationEmail");
const { sendWelcomeEmail } = require("../helpers/email/WelcomeEmail");

const doSignupEmail = async ({ email, dpa, marketing, datalabs }) => {
  console.log("v5 doSignupEmail start::", email, dpa, marketing, datalabs);
  if (!email) {
    throw new Error("Empty params.");
  }

  email = decodeURIComponent(email.toLowerCase().trim());
  const verifyKey = generateRandKey();

  var id = crypto.randomBytes(20).toString("hex");
  const pk = id
  const sk = `CUSTOMER#EMAIL#${firstName || ""}#${lastName || ""}`
  const customerData = {
    pk,
    sk,
    email,
    firstName: "",
    lastName: "",
    password: "",
    createdDate: new Date().toISOString(),
    verifyKey,
    dpa,
    marketing,
    datalabs,
    gs1pk: pk,
    gs1sk: sk,
  };

  console.log("v5 doSignupEmail query email check::");
  const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email } });
  console.log(`log queryEmailResult::`, queryEmailResult, queryEmailResult.Items[0]);

  const customer = queryEmailResult.Count > 0 ? queryEmailResult.Items[0] : {};

  if (queryEmailResult.Count === 0) {
    console.log("doSignupEmail create customer::");
    await sendVerificationEmail({ email, verifyKey, verifyLink: "" });
    await create({ item: customerData });
    return { success: true };
  } else if (queryEmailResult.Count > 0 && (customer.firstName || customer.lastName || customer.password)) {
    return {
      success: false,
      message: "Email is already registered",
      code: "ALREADY_REGISTERED_EMAIL",
    };
  } else {
    console.log("previous verify key::", customer.verifyKey);
    console.log("doSignupEmail update customer verify key::", { ...customer, verifyKey });
    await sendVerificationEmail({ email, verifyKey, verifyLink: "" });
    await updateOne({ item: { ...customer, verifyKey } });
    return {
      success: true,
      message: "Email is already registered but did not complete registration process.",
      code: "ALREADY_REGISTERED_EMAIL_NOT_COMPLETE",
    };
  }
};

const doSignupEmailVerify = async ({ email, key }) => {
  console.log("v2 doSignupEmail verify start::", email, key);

  if (!email || !key) {
    throw new Error("doSignupEmail verify incomplete params");
  }

  email = decodeURIComponent(email.toLowerCase().trim());

  console.log("doSignupEmailVerify query email check::");
  const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email } });
  console.log(`log queryEmailResult::`, queryEmailResult, queryEmailResult.Items[0]);

  const customer = queryEmailResult.Count > 0 ? queryEmailResult.Items[0] : {};

  if (queryEmailResult.Count === 0) {
    console.log("doSignupEmailVerify email not found::", email);
    return { success: false };
  } else {
    if (key !== customer.verifyKey) {
      console.log("doSignupEmailVerify code not valid::", email);
      return {
        success: false,
        message: "Verification code is not valid",
      };
    } else {
      console.log("doSignupEmailVerify success::", email);
      return {
        success: true,
        email,
        key,
      };
    }
  }
};

const doSignupEmailUserInfo = async ({ email, name, password, key }) => {
  console.log("doSignupEmailUserInfo  start::", email, name, password, key);

  if (!email || !name || !password || !key) {
    throw new Error("doSignupEmailUserInfo incomplete params");
  }

  const [firstName, ...lastName] = name.toLowerCase().trim().split(" ");

  email = decodeURIComponent(email.toLowerCase().trim());
  const passDecoded = decodeURIComponent(password.trim());
  const hashedPassword = hashPassword(passDecoded);
  const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email } });
  const customer = queryEmailResult.Count > 0 ? queryEmailResult.Items[0] : {};

  if (queryEmailResult.Count === 0) {
    console.log("doSignupEmailUserInfo email not found::", email);
    return { success: false };
  } else {
    if (key !== customer.verifyKey) {
      console.log("doSignupEmailUserInfo code not valid::", email);
      return {
        success: false,
        message: "Verification code is not valid",
      };
    } else {
      console.log("doSignupEmailUserInfo update customer::", {
        ...customer,
        firstName,
        lastName: lastName.join(" "),
      });
      await updateOne({
        item: {
          ...customer,
          firstName,
          lastName: lastName.join(" "),
          password: hashedPassword,
        },
      });
      await sendWelcomeEmail({ email, firstName });
      console.log("doSignupEmailUserInfo success::", email);
      return {
        success: true,
        email,
      };
    }
  }
};

module.exports = { doSignupEmail, doSignupEmailVerify, doSignupEmailUserInfo };
