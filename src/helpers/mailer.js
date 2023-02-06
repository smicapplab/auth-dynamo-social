const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const config = require("./config");

const { MailSender } = config;

const sendMail = async (mailData) => {
  try {
    const { to, cc, subject, message } = mailData;
    const params = {
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: message,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: [MailSender],
    };

    if (cc && cc.length > 0) {
      params.Destination.CcAddresses = cc;
    }

    const client = new SESClient({ region: "ap-southeast-1" });

    const command = new SendEmailCommand(params);

    await client.send(command);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = sendMail;
