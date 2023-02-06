const sendMail = require("../mailer");

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

const sendWelcomeEmail = async ({ email, firstName }) => {
  const capitalizedName = capitalize(firstName);
  const message = assembleWelcomeEmail({ capitalizedName });
  await sendMail({ to: email, subject: `Welcome, ${capitalizedName}!`, message });
};

const assembleWelcomeEmail = ({ capitalizedName }) => `
<!DOCTYPE html>
<head>
   <meta name="viewport" content="width=device-width" />
</head>
<body style="box-sizing: border-box; font-family: Helvetica, Arial, sans-serif; background-color: #D3D3D3; padding: 0px; width: 100%; ">
   <div style="box-sizing: border-box; width: 100%; padding: 0; margin: 0; background-color: #fff; ">
   <div style=" box-sizing: border-box; width: 100%; padding: 20px 16px;">
      <p style="padding: 10px 20px 10px 0px;">Hi, ${capitalizedName}!</p>
      <div style="width: 100%;">
         <p style="padding: 10px 20px 20px 0px;">Welcome to the App!</p>
      </div>
   </div>
   <div style="box-sizing: border-box; width: 100%; text-align: left; background-color: #535a5f; padding: 4px 0px; margin-top: 0px;">&nbsp;</div>
</body>
</html>
`;

module.exports = { sendWelcomeEmail };
