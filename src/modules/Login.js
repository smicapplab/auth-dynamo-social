const bcrypt = require("bcryptjs");
const { findByIndex } = require("../helpers/dynamo");
const { generateTokens, getSocialFlag } = require("../helpers/common");

const doLogin = async ({ email, password }) => {
  console.log("doLogin start::");
  if (!email || !password) {
    throw new Error("Empty params.");
  }

  email = decodeURIComponent(email.toLowerCase().trim());

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

  if (Count === 0) {
    return {
      success: false,
      message: "Customer not found.",
    };
  }

  const customer = Items[0];
  if (!customer.password) {
    if (getSocialFlag(customer.gs1pk) !== "apple") {
      return {
        success: false,
        message: "Your email address is connected to Apple ID. Use the Apple button to sign in.",
      };
    } else if (getSocialFlag(customer.gs1pk) !== "google") {
      return {
        success: false,
        message: "Your email address is connected to Google. Use the Google button to sign in.",
      };
    } else if (getSocialFlag(customer.gs1pk) !== "facebook") {
      return {
        success: false,
        message: "Your email address is connected to Facebook. Use the Facebook button to sign in.",
      };
    } else {
      return {
        success: false,
        message: "Sign up not completed.",
      };
    }
  }

  console.log("doLogin compare::", customer);
  const passDecoded = decodeURIComponent(password);
  const passwordMatched = bcrypt.compareSync(passDecoded, customer.password);
  if (!passwordMatched) {
    return {
      success: false,
      message: "Invalid email or mobile number and password",
    };
  }

  const tokens = await generateTokens({ customer });
  return { success: true, tokens };
};

module.exports = { doLogin };
