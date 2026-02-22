import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/utils/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received registration data:', {
      ...body,
      password: '[REDACTED]' // Never log actual passwords
    });

    const { fullName, email, password } = body;

    // Debug logging without sensitive data
    console.log('Parsed fields:', {
      fullName,
      email,
      password: password ? '[REDACTED]' : undefined
    });

    if (!fullName || !email || !password) {
      console.log('Missing fields:', {
        fullName: !fullName,
        email: !email,
        password: !password
      });
      return NextResponse.json(
        { message: 'All fields are required', details: { fullName: !fullName, email: !email, password: !password } },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { message: 'Email already registered' },
          { status: 400 }
        );
      } else {
        // If user exists but not verified, update their information
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').updateOne(
          { _id: existingUser._id },
          {
            $set: {
              fullName,
              password: hashedPassword,
              updatedAt: new Date(),
            },
          }
        );

        // Send new verification email
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await db.collection('otps').updateOne(
          { email: email.toLowerCase() },
          {
            $set: {
              otp,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
          },
          { upsert: true }
        );

        await sendVerificationEmail(email, otp);

        return NextResponse.json(
          { message: 'Verification email sent' },
          { status: 200 }
        );
      }
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate and store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.collection('otps').insertOne({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send verification email
    await sendVerificationEmail(email, otp);

    return NextResponse.json(
      { message: 'Verification email sent' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Failed to register' },
      { status: 500 }
    );
  }
} 