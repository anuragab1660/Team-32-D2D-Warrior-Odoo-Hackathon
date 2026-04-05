const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpService = process.env.SMTP_SERVICE || 'gmail';

const transporter = smtpService === 'gmail'
  ? nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  : nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_PORT) === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendInviteEmail = async (to, name, inviteToken) => {
  const link = `${process.env.APP_URL}/set-password?token=${inviteToken}`;
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: 'You have been invited to ProsubX Portal',
    html: `
      <h2>Hello ${name},</h2>
      <p>You have been invited to join the ProsubX portal as an internal team member.</p>
      <p>Click the link below to set your password and activate your account:</p>
      <a href="${link}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">Set Your Password</a>
      <p>This link expires in 48 hours.</p>
      <p>If you did not expect this invitation, please ignore this email.</p>
    `,
  });
};

const sendVerifyEmail = async (to, name, verifyToken) => {
  const link = `${process.env.APP_URL}/verify-email?token=${verifyToken}`;
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: 'Verify your ProsubX account',
    html: `
      <h2>Hello ${name},</h2>
      <p>Thank you for signing up for ProsubX. Please verify your email address to activate your account.</p>
      <a href="${link}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

const sendPasswordResetEmail = async (to, name, resetToken) => {
  const link = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: 'Reset your ProsubX password',
    html: `
      <h2>Hello ${name},</h2>
      <p>We received a request to reset your password.</p>
      <a href="${link}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">Reset Password</a>
      <p>This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
    `,
  });
};

module.exports = { sendInviteEmail, sendVerifyEmail, sendPasswordResetEmail };
