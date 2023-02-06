const RegisterSocial = require("./RegisterSocial");
const { generateTokens } = require("../helpers/common");
const { findByIndex } = require("../helpers/dynamo");
const { sendWelcomeEmail } = require("../helpers/email/WelcomeEmail");

const doFbLoginCheck = async ({ email }) => {
  const FACEBOOK = "facebook";

  const queryEmailResult = await findByIndex({
    indexName: "email-index",
    query: { email: decodeURIComponent(email.toLowerCase().trim()) },
    filter: {},
    limit: 1,
  });

  if (queryEmailResult.Items[0]) {
    if (queryEmailResult.Items[0].socialFlag !== FACEBOOK) {
      const socialFlag = queryEmailResult.Items[0].socialFlag
        ? queryEmailResult.Items[0]?.socialFlag
        : "email or mobile number";
      return {
        success: false,
        message: "Email associated with your Facebook account already exists. " + `Please sign in with ${socialFlag}.`,
        code: "ALREADY_REGISTERED_FB_EMAIL",
      };
    }
  }

  if (!queryEmailResult.Items[0]) {
    return {
      success: true,
      code: "SHOW_CONSENT",
      message: "Facebook account not yet registered",
    };
  } else {
    if (queryEmailResult.Items[0].dpa) {
      return {
        success: true,
        code: "PROCEED_WITH_LOGIN",
        message: "Facebook account registered",
        dpa: queryEmailResult.Items[0].dpa,
        marketing: queryEmailResult.Items[0].marketing,
        datalabs: queryEmailResult.Items[0].datalabs,
      };
    } else {
      return {
        success: true,
        code: "SHOW_CONSENT",
        message: "Facebook account registered with dpa false",
      };
    }
  }
};

const doFbLogin = async ({ userId, email, firstName, lastName, dpa = false, marketing = false, datalabs = false }) => {
  const FACEBOOK = "facebook";

  const queryEmailResult = await findByIndex({
    indexName: "email-index",
    query: { email: decodeURIComponent(email.toLowerCase().trim()) },
    filter: {},
    limit: 1,
  });

  if (!queryEmailResult.Items[0]) {
    const registerSocialResult = await RegisterSocial({
      email,
      firstName: firstName.toLowerCase().trim(),
      lastName: lastName.toLowerCase().trim(),
      userId,
      socialFlag: FACEBOOK,
      dpa,
      marketing,
      datalabs,
    });
    if (registerSocialResult && registerSocialResult.success) {
      await sendWelcomeEmail({ email, firstName: firstName.toLowerCase().trim() });
      const tokens = await generateTokens({ customer: registerSocialResult.customer });
      return { success: true, tokens };
    } else {
      return {
        success: false,
        message: "Facebook register social failed for some reason.",
      };
    }
  } else {
    const tokens = await generateTokens({ customer: queryEmailResult.Items[0] });
    return { success: true, tokens };
  }
};

module.exports = { doFbLogin, doFbLoginCheck };
