const { generateRandKey } = require("../helpers/common");
const { updateOne, findByIndex } = require("../helpers/dynamo");
const { hashPassword } = require("../helpers/encryption");
const bcrypt = require("bcryptjs");
const { generateTokens, verifyToken, getAuthorizationToken } = require("../helpers/common");
const {
  sendVerificationEmailForUpdate,
  sendVerificationEmailNoticeForUpdate,
} = require("../helpers/email/VerificationEmail");
const { sendMessageInfobip } = require("../helpers/infoBip");
const crypto = require("crypto");

const doProfileNameUpdate = async ({ headers, firstname, lastname }) => {
  if (!firstname || !lastname) {
    throw new Error("doProfileNameUpdate incomplete params.");
  }
  const token = await getAuthorizationToken(headers);
  const decoded = await verifyToken(token);
  if (!decoded || !decoded.pk || !decoded.sk) {
    throw new Error("doProfileNameUpdate not allowed");
  }
  const { email, mobile } = decoded;

  let Count = 0;
  let Items = [];
  if (email) {
    const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  } else if (mobile) {
    const queryMobileResult = await findByIndex({ indexName: "mobile-index", query: { mobile }, filter: {}, limit: 1 });
    Count = queryMobileResult.Count;
    Items = queryMobileResult.Items;
  } else {
    return { success: false, message: "Customer not found." };
  }

  const customer = Items[0];
  if (Count > 0) {
    await updateOne({
      item: {
        ...customer,
        firstName: firstname,
        lastName: lastname,
      },
    });

    const tokens = await generateTokens({
      customer: {
        ...customer,
        firstName: firstname,
        lastName: lastname,
      },
    });
    return {
      success: true,
      tokens,
      message: "Profile name updated.",
    };
  } else {
    return { success: false, message: "Customer not found." };
  }
};

const doProfileEmailUpdate = async ({ headers, newemail }) => {
  if (!newemail) {
    throw new Error("doProfileEmailUpdate incomplete params.");
  }
  const token = await getAuthorizationToken(headers);
  const decoded = await verifyToken(token);
  if (!decoded || !decoded.pk || !decoded.sk) {
    throw new Error("doProfileEmailUpdate not allowed");
  }
  const { email } = decoded;

  let Count = 0;
  let Items = [];
  if (email) {
    const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  } else {
    return { success: false, message: "Customer not found." };
  }

  const customer = Items[0];
  if (Count > 0) {
    newemail = decodeURIComponent(newemail.toLowerCase().trim());
    const queryNewEmailResult = await findByIndex({
      indexName: "email-index",
      query: { email: newemail },
      filter: {},
      limit: 1,
    });

    if (queryNewEmailResult.Count === 0) {
      const verifyKey = generateRandKey();
      await updateOne({
        item: {
          ...customer,
          newemail,
          verifyKey,
        },
      });
      await sendVerificationEmailNoticeForUpdate({ email, verifyLink: "", firstName: customer.firstName });
      await sendVerificationEmailForUpdate({
        email: newemail,
        verifyKey,
        verifyLink: "",
        firstName: customer.firstName,
      });

      return {
        success: true,
        message: "New email temporarily saved.",
      };
    } else {
      return { success: false, message: "Email already used by an existing account." };
    }
  } else {
    return { success: false, message: "Customer not found." };
  }
};

const doProfileEmailUpdateVerify = async ({ headers, key }) => {
  if (!key) {
    throw new Error("doProfileEmailUpdateVerify incomplete params.");
  }
  const token = await getAuthorizationToken(headers);
  const decoded = await verifyToken(token);
  if (!decoded || !decoded.pk || !decoded.sk) {
    throw new Error("doProfileEmailUpdateVerify not allowed");
  }
  const { email } = decoded;

  let Count = 0;
  let Items = [];
  if (email) {
    const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  } else {
    return { success: false, message: "Customer not found." };
  }

  const customer = Items[0];
  if (Count > 0) {
    if (key !== customer.verifyKey) {
      return {
        success: false,
        message: "Verification code is not valid",
      };
    } else {
      const newemail = customer.newemail;
      await updateOne({
        item: {
          ...customer,
          email: newemail,
          newemail: "",
        },
      });
      return {
        success: true,
        message: "",
      };
    }
  } else {
    return { success: false, message: "Customer not found." };
  }
};

const doProfileMobileUpdate = async ({ headers, newmobile }) => {
  if (!newmobile) {
    throw new Error("doProfileMobileUpdate incomplete params.");
  }
  const token = await getAuthorizationToken(headers);
  const decoded = await verifyToken(token);
  if (!decoded || !decoded.pk || !decoded.sk) {
    throw new Error("doProfileMobileUpdate not allowed");
  }
  const { mobile } = decoded;

  let Count = 0;
  let Items = [];
  if (mobile) {
    const queryMobileResult = await findByIndex({ indexName: "mobile-index", query: { mobile }, filter: {}, limit: 1 });
    Count = queryMobileResult.Count;
    Items = queryMobileResult.Items;
  } else {
    return { success: false, message: "Customer not found." };
  }

  const customer = Items[0];
  if (Count > 0) {
    newmobile = decodeURIComponent(newmobile.toLowerCase().trim());
    const queryNewMobileResult = await findByIndex({
      indexName: "mobile-index",
      query: { mobile: newmobile },
      filter: {},
      limit: 1,
    });

    if (queryNewMobileResult.Count === 0) {
      const verifyKey = generateRandKey();
      await updateOne({
        item: {
          ...customer,
          newmobile,
          verifyKey,
        },
      });
      await sendMessageInfobip(
        "We noticed that you changed your registered mobile number. If you did not make this request, you may contact us.",
        mobile
      );
      await sendMessageInfobip(
        `To update your mobile number, use OTP code ${verifyKey}. Never share your OTP.`,
        newmobile
      );

      return {
        success: true,
        message: "New mobile number temporarily saved.",
      };
    } else {
      return { success: false, message: "Mobile number already used by an existing account." };
    }
  } else {
    return { success: false, message: "Customer not found." };
  }
};

const doProfileMobileUpdateVerify = async ({ headers, key }) => {
  if (!key) {
    throw new Error("doProfileMobileUpdateVerify incomplete params.");
  }
  const token = await getAuthorizationToken(headers);
  const decoded = await verifyToken(token);
  if (!decoded || !decoded.pk || !decoded.sk) {
    throw new Error("doProfileMobileUpdateVerify not allowed");
  }
  const { mobile } = decoded;

  let Count = 0;
  let Items = [];
  if (mobile) {
    const queryMobileResult = await findByIndex({ indexName: "mobile-index", query: { mobile }, filter: {}, limit: 1 });
    Count = queryMobileResult.Count;
    Items = queryMobileResult.Items;
  } else {
    return { success: false, message: "Customer not found." };
  }

  const customer = Items[0];
  if (Count > 0) {
    if (key !== customer.verifyKey) {
      return {
        success: false,
        message: "Verification code is not valid",
      };
    } else {
      const newmobile = customer.newmobile;
      await updateOne({
        item: {
          ...customer,
          mobile: newmobile,
          newmobile: "",
        },
      });
      return {
        success: true,
        message: "",
      };
    }
  } else {
    return { success: false, message: "Customer not found." };
  }
};

const doProfileCredentialUpdate = async ({ headers, currentpassword, newpassword }) => {
  if (!currentpassword || !newpassword) {
    throw new Error("doProfileCredentialUpdate incomplete params.");
  }
  const token = await getAuthorizationToken(headers);
  const decoded = await verifyToken(token);
  if (!decoded || !decoded.pk || !decoded.sk) {
    throw new Error("doProfileCredentialUpdate not allowed");
  }
  const { email, mobile } = decoded;

  let Count = 0;
  let Items = [];
  if (email) {
    const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  } else if (mobile) {
    const queryMobileResult = await findByIndex({ indexName: "mobile-index", query: { mobile }, filter: {}, limit: 1 });
    Count = queryMobileResult.Count;
    Items = queryMobileResult.Items;
  } else {
    return { success: false, message: "Customer not found." };
  }

  const customer = Items[0];

  const passDecoded = decodeURIComponent(currentpassword.trim());
  const passwordMatched = bcrypt.compareSync(passDecoded, customer.password);

  let hashedNewPassword = "";
  if (!passwordMatched) {
    return { success: false, message: "Wrong current password." };
  } else {
    const newPassDecoded = decodeURIComponent(newpassword.trim());
    hashedNewPassword = hashPassword(newPassDecoded);
  }

  if (Count > 0) {
    await updateOne({
      item: {
        ...customer,
        password: hashedNewPassword,
      },
    });

    const tokens = await generateTokens({
      customer: {
        ...customer,
        password: hashedNewPassword,
      },
    });

    return {
      success: true,
      tokens,
      message: "Profile credential updated.",
    };
  } else {
    return { success: false, message: "Customer not found." };
  }
};

const doProfileDelete = async ({ headers }) => {
  const token = await getAuthorizationToken(headers);
  const decoded = await verifyToken(token);
  if (!decoded || !decoded.pk || !decoded.sk) {
    throw new Error("doProfileDelete not allowed");
  }
  const { email, mobile } = decoded;

  let Count = 0;
  let Items = [];
  if (email) {
    const queryEmailResult = await findByIndex({ indexName: "email-index", query: { email }, filter: {}, limit: 1 });
    Count = queryEmailResult.Count;
    Items = queryEmailResult.Items;
  } else if (mobile) {
    const queryMobileResult = await findByIndex({ indexName: "mobile-index", query: { mobile }, filter: {}, limit: 1 });
    Count = queryMobileResult.Count;
    Items = queryMobileResult.Items;
  } else {
    return { success: false, message: "Customer not found." };
  }

  const customer = Items[0];
  const { pk, sk } = customer;
  if (Count > 0) {
    const randomString = crypto.randomBytes(20).toString("hex");
    await updateOne({
      item: {
        pk,
        sk,
        firstName: "Deleted",
        lastName: "User",
        mobile: `${randomString}09000000000`,
        email: `${randomString}@deleted.com`,
        socialId: "",
        socialFlag: "",
        status: "deleted",
      },
    });

    return {
      success: true,
      message: "Profile deleted.",
    };
  } else {
    return { success: false, message: "Customer not found." };
  }
};

module.exports = {
  doProfileNameUpdate,
  doProfileEmailUpdate,
  doProfileEmailUpdateVerify,
  doProfileMobileUpdate,
  doProfileMobileUpdateVerify,
  doProfileCredentialUpdate,
  doProfileDelete,
};
