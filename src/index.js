const { doFbLogin, doFbLoginCheck } = require("./modules/Facebook");
const { doGoogleLogin, doGoogleLoginCheck } = require("./modules/Google");
const { doAppleLogin, doAppleWebnoniosLogin, doAppleLoginCheck } = require("./modules/Apple");
const { doSignupPhone, doSignupPhoneVerify, doSignupPhoneUserInfo } = require("./modules/SignupPhone");
const { doSignupEmail, doSignupEmailVerify, doSignupEmailUserInfo } = require("./modules/SignupEmail");
const { doForgotPassword, doForgotPasswordVerify, doForgotPasswordUpdate } = require("./modules/ForgotPassword");
const {
  doProfileNameUpdate,
  doProfileEmailUpdate,
  doProfileEmailUpdateVerify,
  doProfileMobileUpdate,
  doProfileMobileUpdateVerify,
  doProfileCredentialUpdate,
  doProfileDelete,
} = require("./modules/Profile");
const { doLogin } = require("./modules/Login");

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const noParseResource = [`/apple/webnonios`];

  try {
    const resource = event.resource;
    const pathParameters = event.pathParameters;
    const body = noParseResource.includes(resource) ? event.body : JSON.parse(event.body);
    const headers = event.headers;

    console.log({
      // NodeEnv,
      event,
      context,
      body,
      pathParameters,
    });

    let response = null;
    switch (resource) {
      case `/login`:
        console.log("doLogin start::");
        response = await doLogin(body);
        break;
      case `/facebook/native`:
        response = await doFbLogin(body);
        break;
      case `/facebook/native/check`:
        response = await doFbLoginCheck(body);
        break;
      case `/google/native`:
        response = await doGoogleLogin(body);
        break;
      case `/google/native/check`:
        response = await doGoogleLoginCheck(body);
        break;
      case `/apple/native`:
        response = await doAppleLogin(body);
        break;
      case `/apple/webnonios`:
        return await doAppleWebnoniosLogin(body);
      case `/apple/native/check`:
        response = await doAppleLoginCheck(body);
        break;
      case `/signup/phone`:
        response = await doSignupPhone(body);
        break;
      case `/signup/phone/verify`:
        response = await doSignupPhoneVerify(body);
        break;
      case `/signup/phone/userinfo`:
        response = await doSignupPhoneUserInfo(body);
        break;
      case `/signup/email`:
        response = await doSignupEmail(body);
        break;
      case `/signup/email/verify`:
        response = await doSignupEmailVerify(body);
        break;
      case `/signup/email/userinfo`:
        response = await doSignupEmailUserInfo(body);
        break;
      case `/signin/reset`:
        response = await doForgotPassword(body);
        break;
      case `/signin/reset/verify`:
        response = await doForgotPasswordVerify(body);
        break;
      case `/signin/reset/update`:
        response = await doForgotPasswordUpdate(body);
        break;
      case `/profile/name`:
        response = await doProfileNameUpdate({ headers, ...body });
        break;
      case `/profile/email`:
        response = await doProfileEmailUpdate({ headers, ...body });
        break;
      case `/profile/email/verify`:
        response = await doProfileEmailUpdateVerify({ headers, ...body });
        break;
      case `/profile/mobile`:
        response = await doProfileMobileUpdate({ headers, ...body });
        break;
      case `/profile/mobile/verify`:
        response = await doProfileMobileUpdateVerify({ headers, ...body });
        break;
      case `/profile/credential`:
        response = await doProfileCredentialUpdate({ headers, ...body });
        break;
      case `/profile/delete`:
        response = await doProfileDelete({ headers });
        break;
      default:
        break;
    }

    if (response) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(response),
        isBase64Encoded: false,
      };
    }
  } catch (error) {
    console.error("CATCH", { error });
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        target: "",
        message: error.message,
        payloadReceived: event.body ? event.body : "",
      }),
    };
  }
};
