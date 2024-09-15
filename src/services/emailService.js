const nodemailer = require('nodemailer');
const config = require('../config/email');
const ejs = require("ejs");
const path = require("path");
const { promisify } = require("util");

const renderFile = promisify(ejs.renderFile);

// Create a transporter object using the SMTP configuration
const transporter = nodemailer.createTransport(config.smtp);

/**
 * Sends a verification email to the user.
 *
 * @param {Object} user - The user object containing email and username.
 * @param {string} token - The verification token for the user.
 * @returns {Promise<void>}
 */
exports.sendVerificationEmail = async (user, token) => {
  // Construct the verification URL
  const verificationUrl = `${config.appUrl}/verify-email?token=${token}`;

  // Define the email options
  const mailOptions = {
    from: config.from, // Sender's address
    to: user.email, // Recipient's address
    subject: "Verify your email address", // Subject line
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            h1 {
              color: #333;
            }
            a {
              color: #007BFF;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Email Verification</h1>
            <p>Hello ${user.username},</p>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        </body>
      </html>
    `, // HTML body content
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    // Log the error if sending fails
    console.error("Error sending verification email:", error);
  }
};

exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const htmlContent = await renderFile(
    path.join(__dirname, "../templates/resetPassword.ejs"),
    { username: user.username, resetUrl }
  );

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Reset Your Password",
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};
