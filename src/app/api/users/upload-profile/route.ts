import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { message: 'File and user ID are required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${userId}-${timestamp}.${extension}`;

    // Save file to public/uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Update user's profile picture in database
    const { db } = await connectToDatabase();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { profilePicture: `/uploads/${filename}` } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { profilePicture: `/uploads/${filename}` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return NextResponse.json(
      { message: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
} 