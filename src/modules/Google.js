const RegisterSocial = require("./RegisterSocial");
const { generateTokens } = require("../helpers/common");
const { findByIndex } = require("../helpers/dynamo");
const { sendWelcomeEmail } = require("../helpers/email/WelcomeEmail");

const doGoogleLoginCheck = async ({ email }) => {
  const GOOGLE = "google";

  const queryEmailResult = await findByIndex({
    indexName: "email-index",
    query: { email: decodeURIComponent(email.toLowerCase().trim()) },
    filter: {},
    limit: 1,
  });

  if (queryEmailResult.Items[0]) {
    if (queryEmailResult.Items[0].socialFlag !== GOOGLE) {
      const socialFlag = queryEmailResult.Items[0].socialFlag
        ? queryEmailResult.Items[0]?.socialFlag
        : "email or mobile number";
      return {
        success: false,
        message: "Email associated with your Google account already exists. " + `Please sign in with ${socialFlag}.`,
        code: "ALREADY_REGISTERED_GOOGLE_EMAIL",
      };
    }
  }

  if (!queryEmailResult.Items[0]) {
    return {
      success: true,
      code: "SHOW_CONSENT",
      message: "Google account not yet registered",
    };
  } else {
    if (queryEmailResult.Items[0].dpa) {
      return {
        success: true,
        code: "PROCEED_WITH_LOGIN",
        message: "Google account registered",
        dpa: queryEmailResult.Items[0].dpa,
        marketing: queryEmailResult.Items[0].marketing,
        datalabs: queryEmailResult.Items[0].datalabs,
      };
    } else {
      return {
        success: true,
        code: "SHOW_CONSENT",
        message: "Google account registered with dpa false",
      };
    }
  }
};

const doGoogleLogin = async ({
  userId,
  email,
  firstName,
  lastName,
  dpa = false,
  marketing = false,
  datalabs = false,
}) => {
  const GOOGLE = "google";

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
      socialFlag: GOOGLE,
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
        message: "Google register social failed for some reason.",
      };
    }
  } else {
    const tokens = await generateTokens({ customer: queryEmailResult.Items[0] });
    return { success: true, tokens };
  }
};

module.exports = { doGoogleLogin, doGoogleLoginCheck };
