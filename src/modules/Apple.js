const AppleAuth = require("apple-auth");
const { decode } = require("jsonwebtoken");

const RegisterSocial = require("./RegisterSocial");
const { generateTokens } = require("../helpers/common");
const { findByIndex } = require("../helpers/dynamo");
const { sendWelcomeEmail } = require("../helpers/email/WelcomeEmail");
const config = require("../helpers/config");

const { NodeEnv } = config;

const generateMessage = (socialFlag) => {
  if (socialFlag) {
    return "Email associated with your Apple ID account already exists. " + `Please sign in with ${socialFlag}.`;
  } else {
    return (
      "Email associated with your Apple ID account already exists. " + `Please sign in with email or mobile number.`
    );
  }
};

const doAppleLoginCheck = async ({ code }) => {
  const APPLE = "apple";

  const auth = new AppleAuth(
    {
      client_id: "steve.torrefranca.com",
      team_id: "XXXXXBBBBS",
      redirect_uri: "",
      key_id: "LBTSCCCC",
    },
    "text"
  );

  const accessToken = await auth.accessToken(code);
  const idToken = decode(accessToken.id_token);
  const userId = idToken.sub;
  const email = idToken.email;
  let queryResult = {};
  if (email) {
    queryResult = await findByIndex({
      indexName: "email-index",
      query: { email: email },
      filter: {},
      limit: 1,
    });

    if (queryResult.Items[0]) {
      if (queryResult.Items[0].socialFlag !== APPLE) {
        return {
          success: false,
          message: generateMessage(queryResult.Items[0].socialFlag),
          code: "ALREADY_REGISTERED_APPLE_ID_EMAIL",
        };
      }
    }
  } else {
    queryResult = await findByIndex({
      indexName: "mobile-index",
      query: { mobile: userId },
      filter: {},
      limit: 1,
    });

    if (queryResult.Items[0]) {
      if (queryResult.Items[0].socialFlag !== APPLE) {
        return {
          success: false,
          message: generateMessage(queryResult.Items[0].socialFlag),
          code: "ALREADY_REGISTERED_APPLE_ID_EMAIL",
        };
      }
    }
  }

  if (!queryResult.Items[0]) {
    return {
      success: true,
      code: "SHOW_CONSENT",
      message: "Apple account not yet registered",
      email,
      userId,
    };
  } else {
    if (queryResult.Items[0].dpa) {
      return {
        success: true,
        code: "PROCEED_WITH_LOGIN",
        message: "Apple account registered",
        email,
        userId,
        dpa: queryResult.Items[0].dpa,
        marketing: queryResult.Items[0].marketing,
        datalabs: queryResult.Items[0].datalabs,
      };
    } else {
      return {
        success: true,
        code: "SHOW_CONSENT",
        message: "Apple account registered with dpa false",
      };
    }
  }
};

const doAppleCommonLogin = async ({
  userId,
  email,
  firstName,
  lastName,
  dpa = false,
  marketing = false,
  datalabs = false,
}) => {
  const APPLE = "apple";

  const queryEmailResult = await findByIndex({
    indexName: "email-index",
    query: { email: decodeURIComponent(email.toLowerCase().trim()) },
    filter: {},
    limit: 1,
  });

  if (!queryEmailResult.Items[0]) {
    const registerSocialResult = await RegisterSocial({
      email,
      firstName: firstName ? firstName.toLowerCase().trim() : "",
      lastName: lastName ? lastName.toLowerCase().trim() : "",
      userId,
      socialFlag: APPLE,
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
        message: "Apple register social failed for some reason.",
      };
    }
  } else {
    const tokens = await generateTokens({ customer: queryEmailResult.Items[0] });
    return { success: true, tokens };
  }
};

const doAppleLogin = async ({
  email,
  userId,
  firstName,
  lastName,
  dpa = false,
  marketing = false,
  datalabs = false,
}) => {
  return await doAppleCommonLogin({ userId, email, firstName, lastName, dpa, marketing, datalabs });
};

const doAppleWebnoniosLogin = async (body) => {
  const APPLE = "apple";

  const urlParams = new URLSearchParams(body);
  const idToken = decode(urlParams.get("id_token"));
  const userId = idToken.sub;
  const email = idToken.email;

  console.log("doAppleWebnoniosLogin::", userId, email);

  let firstName = "";
  let lastName = "";

  if (urlParams.get("user") && JSON.parse(urlParams.get("user"))) {
    const user = JSON.parse(urlParams.get("user"));
    firstName = user.name.firstName;
    lastName = user.name.lastName;
  }

  let success = false;
  let message = "";
  let code = "";
  let dpa = false;
  let marketing = false;
  let datalabs = false;

  if (email) {
    queryResult = await findByIndex({
      indexName: "email-index",
      query: { email: email },
      filter: {},
      limit: 1,
    });
    if (queryResult.Items[0]) {
      if (queryResult.Items[0].socialFlag !== APPLE) {
        success = false;
        message = generateMessage(queryResult.Items[0].socialFlag);
        code = "ALREADY_REGISTERED_APPLE_ID_EMAIL";
      }
    }
  } else {
    queryResult = await findByIndex({
      indexName: "mobile-index",
      query: { mobile: userId },
      filter: {},
      limit: 1,
    });

    if (queryResult.Items[0]) {
      if (queryResult.Items[0].socialFlag !== APPLE) {
        success = false;
        message = generateMessage(queryResult.Items[0].socialFlag);
        code = "ALREADY_REGISTERED_APPLE_ID_EMAIL";
      }
    }
  }

  if (!queryResult.Items[0]) {
    success = true;
    code = "SHOW_CONSENT";
    message = "Apple account not yet registered";
  } else {
    if (queryResult.Items[0].dpa) {
      success = true;
      code = "PROCEED_WITH_LOGIN";
      message = "Apple account registered";
      dpa = queryResult.Items[0].dpa;
      marketing = queryResult.Items[0].marketing;
      datalabs = queryResult.Items[0].datalabs;
    } else {
      success = true;
      code = "SHOW_CONSENT";
      message = "Apple account registered with dpa false";
    }
  }

  const extraParams = `&action=apple_login&success=${success}&code=${code}&message=${message}&dpa=${dpa}&marketing=${marketing}&datalabs=${datalabs}`;
  const pathParams = `userId=${userId}&email=${email}&firstName=${firstName}&lastName=${lastName}${extraParams}`;

  if (NodeEnv !== "production") {
    return {
      statusCode: 301,
    };
  } else {
    return {
      statusCode: 301,
    };
  }

};

module.exports = { doAppleLogin, doAppleWebnoniosLogin, doAppleLoginCheck };
