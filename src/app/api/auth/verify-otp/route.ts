import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find the OTP record
    const otpRecord = await db.collection('otps').findOne({
      email: email.toLowerCase(),
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Update user's verification status
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { isVerified: true } }
    );

    // Delete the used OTP
    await db.collection('otps').deleteOne({ _id: otpRecord._id });

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
} 