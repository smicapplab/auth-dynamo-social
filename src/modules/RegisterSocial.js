const { create } = require("../helpers/dynamo");
const crypto = require("crypto");

const RegisterSocial = async ({
  email,
  firstName,
  lastName,
  userId,
  socialFlag,
  dpa = false,
  marketing = false,
  datalabs = false,
}) => {
  email = decodeURIComponent(email.toLowerCase().trim());
  const id = crypto.randomBytes(20).toString("hex");
  const pk = id;
  const sk = `CUSTOMER#SOCIAL#${firstName || ""}#${lastName || ""}`
  const customerData = {
    pk,
    sk,
    email,
    firstName,
    lastName,
    createdDate: new Date().toISOString(),
    verifyKey: "",
    socialId: userId,
    socialFlag,
    dpa,
    marketing,
    datalabs,
    gs1pk: pk,
    gs1sk: sk,
  };

  if (socialFlag === "apple") {
    customerData.mobile = userId;
  }

  await create({ item: customerData });
  return { success: true, customer: customerData };
};

module.exports = RegisterSocial;
