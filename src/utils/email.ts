import nodemailer from 'nodemailer';

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check email configuration
const checkEmailConfig = () => {
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.error('Email configuration is missing. Please check your .env file.');
    console.error('Required variables: EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD');
    return false;
  }
  return true;
};

// Create transporter only if configuration is valid
const createTransporter = () => {
  if (!checkEmailConfig()) {
    throw new Error('Email configuration is invalid');
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

    console.log('Verification email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.message.includes('Invalid login')) {
        console.error('Please check your Gmail credentials and App Password');
      }
    }
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
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

    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
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
  try {
    const info = await transporter.sendMail({
      from: `"Travel Planner" <${process.env.EMAIL_SERVER_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
} 