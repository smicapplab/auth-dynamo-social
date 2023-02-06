const { generateRandKey } = require("../helpers/common");
var crypto = require("crypto");
const { create, updateOne, findByIndex } = require("../helpers/dynamo");
const { hashPassword } = require("../helpers/encryption");
const { sendMessageInfobip } = require("../helpers/infoBip");

const doSignupPhone = async ({ phone, dpa, marketing, datalabs }) => {
  console.log("doSignupPhone start::", phone, dpa, marketing, datalabs);
  if (!phone) {
    throw new Error("Empty params.");
  }

  const mobile = decodeURIComponent(phone.toLowerCase().trim());
  const verifyKey = generateRandKey();

  var id = crypto.randomBytes(20).toString("hex");
  const pk = id;
  const sk = `CUSTOMER#PHONE#${firstName || ""}#${lastName || ""}`
  const customerData = {
    pk,
    sk,
    mobile,
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

  console.log("doSignupPhone query phone check::");
  const queryPhoneResult = await findByIndex({ indexName: "mobile-index", query: { mobile } });
  console.log(`log queryPhoneResult::`, queryPhoneResult, queryPhoneResult.Items[0]);

  const customer = queryPhoneResult.Count > 0 ? queryPhoneResult.Items[0] : {};

  if (queryPhoneResult.Count === 0) {
    console.log("doSignupPhone create customer::");
    await sendMessageInfobip(`To create your account, use OTP code ${verifyKey}. Never share your OTP.`, mobile);
    await create({ item: customerData });
    return { success: true };
  } else if (queryPhoneResult.Count > 0 && (customer.firstName || customer.lastName || customer.password)) {
    return {
      success: false,
      message: "Mobile number is already registered",
      code: "ALREADY_REGISTERED_EMAIL",
    };
  } else {
    console.log("previous verify key::", customer.verifyKey);
    console.log("doSignupEmail update customer verify key::", { ...customer, verifyKey });
    const infobipResponse = await sendMessageInfobip(
      `To create your account, use OTP code ${verifyKey}. Never share your OTP.`,
      mobile
    );
    console.log("infobipResponse::", infobipResponse);
    await updateOne({ item: { ...customer, verifyKey } });
    return {
      success: true,
      message: "Mobile number is already registered but did not complete registration process.",
      code: "ALREADY_REGISTERED_PHONE_NOT_COMPLETE",
    };
  }
};

const doSignupPhoneVerify = async ({ phone, key }) => {
  console.log("doSignupPhone verify start::", phone, key);
  if (!phone || !key) {
    throw new Error("doSignupPhone verify incomplete params");
  }
  const mobile = decodeURIComponent(phone.toLowerCase().trim());
  console.log("doSignupPhoneVerify query phone check::");
  const queryPhoneResult = await findByIndex({ indexName: "mobile-index", query: { mobile } });
  console.log(`log queryPhoneResult::`, queryPhoneResult, queryPhoneResult.Items[0]);
  const customer = queryPhoneResult.Count > 0 ? queryPhoneResult.Items[0] : {};
  if (queryPhoneResult.Count === 0) {
    console.log("doSignupPhoneVerify phone not found::", mobile);
    return { success: false };
  } else {
    if (key !== customer.verifyKey) {
      console.log("doSignupPhoneVerify code not valid::", mobile);
      return {
        success: false,
        message: "Verification code is not valid",
      };
    } else {
      console.log("doSignupPhoneVerify success::", mobile);
      return {
        success: true,
        phone,
        key,
      };
    }
  }
};

const doSignupPhoneUserInfo = async ({ phone, name, password, key }) => {
  console.log("doSignupPhoneUserInfo  start::", phone, name, password, key);
  if (!phone || !name || !password || !key) {
    throw new Error("doSignupPhoneUserInfo incomplete params");
  }
  const [firstName, ...lastName] = name.toLowerCase().trim().split(" ");
  const mobile = decodeURIComponent(phone.toLowerCase().trim());

  const passDecoded = decodeURIComponent(password.trim());
  const hashedPassword = hashPassword(passDecoded);
  const queryPhoneResult = await findByIndex({ indexName: "mobile-index", query: { mobile } });
  const customer = queryPhoneResult.Count > 0 ? queryPhoneResult.Items[0] : {};
  if (queryPhoneResult.Count === 0) {
    console.log("doSignupPhoneUserInfo phone not found::", mobile);
    return { success: false };
  } else {
    if (key !== customer.verifyKey) {
      console.log("doSignupPhoneUserInfo code not valid::", mobile);
      return {
        success: false,
        message: "Verification code is not valid",
      };
    } else {
      console.log("doSignupPhoneUserInfo update customer::", {
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
      // await sendWelcomeText({ phone, firstName });
      console.log("doSignupPhoneUserInfo success::", mobile);
      return {
        success: true,
        phone,
      };
    }
  }
};

module.exports = { doSignupPhone, doSignupPhoneVerify, doSignupPhoneUserInfo };
