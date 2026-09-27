import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Generate a cryptographically secure 6-digit OTP
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Check email configuration
const isEmailConfigValid = (): boolean => {
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  if (!user || !pass) return false;
  if (user.includes('your-email') || user.includes('example.com')) return false;
  if (pass.includes('xxxx') || pass.includes('your-gmail-app-password')) return false;
  return true;
};

// Create transporter only if configuration is valid
const createTransporter = () => {
  if (!isEmailConfigValid()) {
    throw new Error('Email credentials not properly configured in .env');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
};

// Send verification email with OTP
export async function sendVerificationEmail(email: string, otp: string) {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isEmailConfigValid()) {
    if (!isProd) {
      console.log(`\n======================================================`);
      console.log(`📧 [DEV EMAIL] Email service unconfigured / dev mode.`);
      console.log(`👤 Recipient: ${email}`);
      console.log(`🔑 Verification OTP: ${otp}`);
      console.log(`👉 Enter this OTP on /verify-email to verify your account.`);
      console.log(`======================================================\n`);
    } else {
      console.error('[Email Service] SMTP credentials not configured in production. Cannot dispatch verification email.');
    }
    return { messageId: isProd ? 'unconfigured-email' : 'dev-mock-otp' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Travel Planner" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for registering with Travel Planner!</p>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    if (!isProd) {
      console.log('Verification email sent successfully:', info.messageId);
    }
    return info;
  } catch (error) {
    console.error('Error sending verification email via SMTP:', error);
    // Never log OTPs in production even on SMTP failure
    if (!isProd) {
      console.log(`\n======================================================`);
      console.log(`⚠️ [DEV FALLBACK] SMTP error. Use this OTP for local testing:`);
      console.log(`👤 Recipient: ${email}`);
      console.log(`🔑 Verification OTP: ${otp}`);
      console.log(`======================================================\n`);
    }
    return { messageId: 'smtp-dispatch-failed' };
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  if (!isEmailConfigValid()) {
    if (!isProd) {
      console.log(`\n======================================================`);
      console.log(`📧 [DEV EMAIL] Password reset requested.`);
      console.log(`👤 Recipient: ${email}`);
      console.log(`🔗 Reset Link: ${resetUrl}`);
      console.log(`======================================================\n`);
    } else {
      console.error('[Email Service] SMTP credentials not configured in production. Cannot dispatch reset email.');
    }
    return { messageId: isProd ? 'unconfigured-email' : 'dev-mock-reset' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Travel Planner" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    if (!isProd) {
      console.log('Password reset email sent:', info.messageId);
    }
    return info;
  } catch (error) {
    console.error('Error sending password reset email via SMTP:', error);
    // Never log reset links or secrets in production
    if (!isProd) {
      console.log(`\n======================================================`);
      console.log(`⚠️ [DEV FALLBACK] SMTP error. Use this Reset URL for local testing:`);
      console.log(`👤 Recipient: ${email}`);
      console.log(`🔗 Reset Link: ${resetUrl}`);
      console.log(`======================================================\n`);
    }
    return { messageId: 'smtp-dispatch-failed' };
  }
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isEmailConfigValid()) {
    if (!isProd) {
      console.log(`\n======================================================`);
      console.log(`📧 [DEV EMAIL] Email dispatch simulated:`);
      console.log(`👤 To: ${to}`);
      console.log(`📝 Subject: ${subject}`);
      console.log(`======================================================\n`);
    } else {
      console.error('[Email Service] SMTP credentials not configured in production.');
    }
    return { messageId: isProd ? 'unconfigured-email' : 'dev-mock-email' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Travel Planner" <${process.env.EMAIL_SERVER_USER}>`,
      to,
      subject,
      html,
    });

    if (!isProd) {
      console.log('Email sent:', info.messageId);
    }
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    return { messageId: 'failed-email' };
  }
} 