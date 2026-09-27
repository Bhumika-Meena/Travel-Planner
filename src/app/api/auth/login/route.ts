import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { signAuthToken, getAuthCookieOptions } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    // Rate limit login attempts: 8 attempts per minute per IP
    const rateLimit = checkRateLimit(`login:${clientIp}`, 8, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: `Too many login attempts. Please try again in ${rateLimit.reset - Math.floor(Date.now() / 1000)} seconds.` },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.reset - Math.floor(Date.now() / 1000)),
          }
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { message: 'Email not verified' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate secure JWT token
    const token = await signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName || user.name || '',
    });

    // Remove password and sensitive tokens from user object before sending response
    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = user;

    // Create response with secure HTTP-only cookie
    const response = NextResponse.json(
      { 
        user: {
          ...userWithoutPassword,
          _id: user._id.toString(),
        },
        message: 'Logged in successfully'
      },
      { status: 200 }
    );

    const cookieOptions = getAuthCookieOptions();
    response.cookies.set({
      name: cookieOptions.name,
      value: token,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Failed to login' },
      { status: 500 }
    );
  }
}