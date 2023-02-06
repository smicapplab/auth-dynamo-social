const { generateRandKey } = require("../helpers/common");
const { updateOne, findByIndex } = require("../helpers/dynamo");
const { hashPassword } = require("../helpers/encryption");
const { sendForgotPasswordVerificationEmail } = require("../helpers/email/ForgotPasswordVerificationEmail");
const { sendMessageInfobip } = require("../helpers/infoBip");

const doForgotPassword = async ({ emailorphone }) => {
  if (!emailorphone) {
    throw new Error("doForgotPassword Empty params.");
  }

  const email = decodeURIComponent(emailorphone.toLowerCase().trim());
  const verifyKey = generateRandKey();

  let Count = 0;
  let Items = [];
  if (email.includes("@")) {
    console.log("doLogin query email check::");
    const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  } else {
    console.log("doLogin query phone check::");
    const mobile = email;
    const queryEmailResult = await findByIndex({ indexName: "mobile-index", query: { mobile }, filter: {}, limit: 1 });
    console.log("doLogin query phone check result::", queryEmailResult);
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  }

  const customer = Items[0];
  if (Count === 0) {
    return { success: false, message: "Customer not found." };
  } else if (Count > 0 && (customer.firstName || customer.lastName || customer.password)) {
    await updateOne({
      item: {
        ...customer,
        verifyKey,
      },
    });
    if (emailorphone.includes("@")) {
      await sendForgotPasswordVerificationEmail({
        email: emailorphone,
        verifyKey,
        verifyLink: "",
        firstName: customer.firstName,
      });
    } else {
      const infobipResponse = await sendMessageInfobip(
        `To reset your password, use OTP code ${verifyKey}. Never share your OTP. If you did not make this reset password request, change your password immediately.`,
        emailorphone
      );
      console.log("infobipResponse::", infobipResponse);
    }
    return {
      success: true,
      type: emailorphone.includes("@") ? "email" : "phone",
    };
  } else {
    return { success: false, message: "Sign up not complete." };
  }
};

const doForgotPasswordVerify = async ({ emailorphone, key }) => {
  if (!emailorphone || !key) {
    throw new Error("doForgotPassword verify incomplete params");
  }
  const email = decodeURIComponent(emailorphone.toLowerCase().trim());

  let Count = 0;
  let Items = [];
  if (email.includes("@")) {
    console.log("doLogin query email check::");
    const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  } else {
    console.log("doLogin query phone check::");
    const mobile = email;
    const queryEmailResult = await findByIndex({ indexName: "mobile-index", query: { mobile }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  }

  const customer = Items[0];
  if (Count === 0) {
    return { success: false, message: "Customer not found." };
  } else {
    if (key !== customer.verifyKey) {
      return {
        success: false,
        message: "Verification code is not valid",
      };
    } else {
      return {
        success: true,
        emailorphone,
        key,
      };
    }
  }
};

const doForgotPasswordUpdate = async ({ emailorphone, password, key }) => {
  if (!emailorphone || !password || !key) {
    throw new Error("doForgotPasswordUpdate incomplete params");
  }

  const email = decodeURIComponent(emailorphone.toLowerCase().trim());

  const passDecoded = decodeURIComponent(password.trim());
  const hashedPassword = hashPassword(passDecoded);

  let Count = 0;
  let Items = [];
  if (email.includes("@")) {
    console.log("doLogin query email check::");
    const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  } else {
    console.log("doLogin query phone check::");
    const mobile = email;
    const queryEmailResult = await findByIndex({ indexName: "mobile-index", query: { mobile }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  }

  const customer = Items[0];

  if (Count === 0) {
    return { success: false, message: "Customer not found." };
  } else {
    if (key !== customer.verifyKey) {
      return {
        success: false,
        message: "Verification code is not valid",
      };
    } else {
      await updateOne({
        item: {
          ...customer,
          password: hashedPassword,
        },
      });
      return {
        success: true,
        type: emailorphone.includes("@") ? "email" : "phone",
        emailorphone,
      };
    }
  }
};

module.exports = { doForgotPassword, doForgotPasswordVerify, doForgotPasswordUpdate };
