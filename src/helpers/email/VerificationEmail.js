const sendMail = require("../mailer");

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

const sendVerificationEmail = async ({ email, verifyKey, verifyLink }) => {
  const message = assembleVerifyEmail({
    verifyKey,
  });
  await sendMail({ to: email, subject: "Verify your account", message });
};

const assembleVerifyEmail = ({ verifyKey }) => `
<!DOCTYPE html>
<head>
   <meta name="viewport" content="width=device-width" />
</head>
<body style="box-sizing: border-box; font-family: Helvetica, Arial, sans-serif; background-color: #D3D3D3; padding: 0px; width: 100%; ">
      <div style="box-sizing: border-box; width: 100%; padding: 0; margin: 0; background-color: #fff; ">
         <div style=" box-sizing: border-box; width: 100%; padding: 20px 16px;">
            <div style="width: 100%;">
               <p style="padding: 0px 20px 0px 0px;">To start, please use this code: <br /> Email Verification Code: <strong>${verifyKey}</strong></p>
            </div>
            <div style="width: 100%;">
               <p style="padding: 0px 20px 0px 0px;">If you did not sign up for an account, please disregard the message.</p>
            </div>
         <div style="box-sizing: border-box; width: 100%; text-align: left; background-color: #535a5f; padding: 4px 12px; margin-top: 0px;">&nbsp;</div>
      </div>
</body>
</html>
`;

const sendVerificationEmailForUpdate = async ({ email, verifyKey, verifyLink, firstName }) => {
  const capitalizedName = capitalize(firstName);
  const message = assembleVerifyEmailForUpdate({
    verifyKey,
    capitalizedName,
  });
  await sendMail({ to: email, subject: "Verify your account", message });
};

const assembleVerifyEmailForUpdate = ({ verifyKey, capitalizedName }) => `
 <!DOCTYPE html>
 <head>
    <meta name="viewport" content="width=device-width" />
 </head>
 <body style="box-sizing: border-box; font-family: Helvetica, Arial, sans-serif; background-color: #D3D3D3; padding: 0px; width: 100%; ">
       <div style="box-sizing: border-box; width: 100%; padding: 0; margin: 0; background-color: #fff; ">
          <div style=" box-sizing: border-box; width: 100%; padding: 20px 16px;">
             <p style="padding: 10px 20px 10px 0px;">Hi, ${capitalizedName}!</p>
             <p style="padding: 10px 20px 0px 0px;">You&rsquo;re just one step away from completing your email update.</p>
             <div style="width: 100%;">
                <p style="padding: 0px 20px 0px 0px;">Please use this code: <br /> Email Verification Code: <strong>${verifyKey}</strong></p>
             </div>
             <div style="width: 100%;">
                <p style="padding: 0px 20px 0px 0px;">If you did not request for email update, please disregard the message.</p>
             </div>
          </div>
          <div style="box-sizing: border-box; width: 100%; text-align: left; background-color: #535a5f; padding: 4px 12px; margin-top: 0px;">&nbsp;</div>
       </div>
 </body>
 </html>
 `;

const sendVerificationEmailNoticeForUpdate = async ({ email, verifyLink, firstName }) => {
  const capitalizedName = capitalize(firstName);
  const message = assembleVerifyEmailNoticeForUpdate({
    capitalizedName,
  });
  await sendMail({ to: email, subject: "Email update notice", message });
};

const assembleVerifyEmailNoticeForUpdate = ({ capitalizedName }) => `
 <!DOCTYPE html>
 <head>
    <meta name="viewport" content="width=device-width" />
 </head>
 <body style="box-sizing: border-box; font-family: Helvetica, Arial, sans-serif; background-color: #D3D3D3; padding: 0px; width: 100%; ">
       <div style="box-sizing: border-box; width: 100%; padding: 0; margin: 0; background-color: #fff; ">
          <div style=" box-sizing: border-box; width: 100%; padding: 20px 16px;">
             <p style="padding: 10px 20px 10px 0px;">Hi, ${capitalizedName}!</p>
             <p style="padding: 10px 20px 0px 0px;"></p>
             <div style="width: 100%;">
                <p style="padding: 0px 20px 0px 0px;">We noticed that you changed your registered email address. If you did not make this request, you may contact us.</strong></p>
             </div>
          </div>
          <div style="box-sizing: border-box; width: 100%; text-align: left; background-color: #535a5f; padding: 4px 12px; margin-top: 0px;">&nbsp;</div>
       </div>
 </body>
 </html>
 `;

module.exports = {
  sendVerificationEmail,
  sendVerificationEmailForUpdate,
  sendVerificationEmailNoticeForUpdate,
};
