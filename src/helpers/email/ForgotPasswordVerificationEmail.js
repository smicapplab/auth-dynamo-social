const sendMail = require("../mailer");

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

const sendForgotPasswordVerificationEmail = async ({ email, verifyKey, firstName }) => {
  const capitalizedName = capitalize(firstName);
  const message = assembleVerifyEmail({
    verifyKey,
    capitalizedName,
  });

  console.log("sendVerificationEmail sending email...:: ");
  await sendMail({ to: email, subject: "Verify your account", message });
};

const assembleVerifyEmail = ({ verifyKey, capitalizedName }) => `
<!DOCTYPE html>
<head>
   <meta name="viewport" content="width=device-width" />
</head>
<body style="box-sizing: border-box; font-family: Helvetica, Arial, sans-serif; background-color: #D3D3D3; padding: 0px; width: 100%; ">
      <div style="box-sizing: border-box; width: 100%; padding: 0; margin: 0; background-color: #fff; ">
         <div style=" box-sizing: border-box; width: 100%; padding: 20px 16px;">
           <p>Hi, ${capitalizedName}!</p>
            <p style="padding: 10px 20px 0px 0px;">We received your request to reset your password. Please input the email verification code below:</p>
            <div style="width: 100%;">
                Email Verification Code: <strong>${verifyKey}</strong></p>
            </div>
            <div style="width: 100%;">
               <p style="padding: 0px 20px 0px 0px;">If you did not make this change or suspect an unauthorized access to your account, change your password immediately.</p>
            </div>
         <div style="box-sizing: border-box; width: 100%; text-align: left; background-color: #535a5f; padding: 4px 12px; margin-top: 0px;">&nbsp;</div>
      </div>
</body>
</html>
`;

module.exports = { sendForgotPasswordVerificationEmail };
