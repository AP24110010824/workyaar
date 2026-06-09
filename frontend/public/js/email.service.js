"use strict";

const nodemailer = require("nodemailer");

/* ======================================================
   MAIL TRANSPORTER
====================================================== */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/* ======================================================
   SEND VERIFICATION EMAIL
====================================================== */
exports.sendVerificationEmail = async (
  email,
  full_name,
  token
) => {

  const verifyUrl =
    `${process.env.FRONTEND_URL}/verify-email.html?token=${token}`;

  await transporter.sendMail({

    from: `"WorkYaar" <${process.env.SMTP_USER}>`,

    to: email,

    subject: "Verify Your WorkYaar Account",

    html: `
      <div style="
        max-width:600px;
        margin:auto;
        padding:30px;
        font-family:Arial,sans-serif;
        background:#ffffff;
        border-radius:10px;
        border:1px solid #e5e7eb;
      ">

        <h2 style="color:#2563eb;margin-bottom:20px;">
          Welcome to WorkYaar
        </h2>

        <p>Hello ${full_name},</p>

        <p>
          Thank you for registering with WorkYaar.
        </p>

        <p>
          Please verify your email address to activate your account.
        </p>

        <div style="margin:30px 0;">
          <a href="${verifyUrl}"
             style="
               background:#2563eb;
               color:#ffffff;
               text-decoration:none;
               padding:14px 24px;
               border-radius:6px;
               display:inline-block;
               font-weight:bold;
             ">
             Verify Email
          </a>
        </div>

        <p>
          This verification link will expire in 24 hours.
        </p>

        <p>
          If you did not create this account,
          please ignore this email.
        </p>

        <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">

        <p style="font-size:12px;color:#666;">
          © WorkYaar
        </p>

      </div>
    `
  });
};

/* ======================================================
   SEND RESET PASSWORD EMAIL
====================================================== */
exports.sendResetPasswordEmail = async (
  email,
  full_name,
  token
) => {

  const resetUrl =
    `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

  await transporter.sendMail({

    from: `"WorkYaar" <${process.env.SMTP_USER}>`,

    to: email,

    subject: "Reset Your WorkYaar Password",

    html: `
      <div style="
        max-width:600px;
        margin:auto;
        padding:30px;
        font-family:Arial,sans-serif;
        background:#ffffff;
        border-radius:10px;
        border:1px solid #e5e7eb;
      ">

        <h2 style="color:#dc2626;margin-bottom:20px;">
          Password Reset Request
        </h2>

        <p>Hello ${full_name},</p>

        <p>
          We received a request to reset your password.
        </p>

        <div style="margin:30px 0;">
          <a href="${resetUrl}"
             style="
               background:#dc2626;
               color:#ffffff;
               text-decoration:none;
               padding:14px 24px;
               border-radius:6px;
               display:inline-block;
               font-weight:bold;
             ">
             Reset Password
          </a>
        </div>

        <p>
          This reset link will expire in 1 hour.
        </p>

        <p>
          If you did not request this,
          please ignore this email.
        </p>

        <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">

        <p style="font-size:12px;color:#666;">
          © WorkYaar
        </p>

      </div>
    `
  });
};