const axios = require("axios");
const https = require("https");

const smsGateWay = {
  gateway: "INFOBIP",
  serviceUri: "https://9rg493.api.infobip.com/sms/2/text/single",
  sender: "Steve Torrefranca",
};

const axiosInfoBipInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  headers: {
    Authorization: smsGateWay.key,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const formatMobile = (phone) => {
  if (phone.length < 11) {
    return `63${phone}`;
  } else if (phone.length === 11) {
    phone = phone.replace(/^0+/, "");
    phone = phone.replace(/[^\d]/g, "");
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, "63$1$2$3");
  }

  return phone;
};

const sendMessageInfobip = async (smsMessage, mobile) => {
  const to = formatMobile(mobile);
  try {
    const { serviceUri, sender } = smsGateWay;
    const body = {
      from: sender,
      to,
      text: smsMessage,
    };
    const response = await axiosInfoBipInstance.post(serviceUri, body);
    return response.data;
  } catch (error) {
    console.error(error.response.data);
  }
};

module.exports = { sendMessageInfobip };
