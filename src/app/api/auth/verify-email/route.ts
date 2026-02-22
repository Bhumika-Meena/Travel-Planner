import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendVerificationEmail } from '@/utils/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if user exists and is not verified
    const user = await db.collection('users').findOne({
      email: email.toLowerCase(),
      isVerified: false
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found or already verified' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update or create OTP record
    await db.collection('otps').updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          otp,
          expiresAt
        }
      },
      { upsert: true }
    );

    // Send verification email
    await sendVerificationEmail(email, otp);

    return NextResponse.json(
      { message: 'Verification email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { message: 'Failed to send verification email' },
      { status: 500 }
    );
  }
} 