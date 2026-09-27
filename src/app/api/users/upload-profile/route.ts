import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ObjectId } from 'mongodb';
import { getAuthSession } from '@/lib/auth';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if environment credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function isCloudinaryConfigured(): boolean {
  if (process.env.CLOUDINARY_URL) return true;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

async function uploadToCloudinary(buffer: Buffer, userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'travel-planner/avatars',
        public_id: `avatar_${userId}_${Date.now()}`,
        resource_type: 'image',
        format: 'webp',
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload returned empty result'));
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

function validateImageMagicBytes(buffer: Buffer): { valid: boolean; ext: string; mime: string } {
  if (buffer.length < 12) {
    return { valid: false, ext: '', mime: '' };
  }

  // Check JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: 'jpg', mime: 'image/jpeg' };
  }

  // Check PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, ext: 'png', mime: 'image/png' };
  }

  // Check WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    (
      (buffer[8] === 0x57 && buffer[9] === 0x42 && buffer[10] === 0x50 && buffer[11] === 0x56) ||
      buffer.toString('ascii', 8, 12) === 'WEBP'
    )
  ) {
    return { valid: true, ext: 'webp', mime: 'image/webp' };
  }

  return { valid: false, ext: '', mime: '' };
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const authenticatedUserId = session?.userId;
    if (!authenticatedUserId) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const requestedUserId = formData.get('userId') as string;

    // Use authenticated user ID to prevent ID spoofing
    const userId = authenticatedUserId;
    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized: Cannot modify another user profile picture' },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { message: 'File is required' },
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

    // Initial magic byte check to reject obvious non-images (SVG, HTML, PHP, scripts)
    const imageInfo = validateImageMagicBytes(buffer);
    if (!imageInfo.valid) {
      return NextResponse.json(
        { message: 'Invalid image format. Only authentic JPEG, PNG, and WebP raster images are allowed.' },
        { status: 400 }
      );
    }

    // Fully decode the image with sharp to verify pixel data and reject corrupt/polyglot files
    let cleanWebpBuffer: Buffer;
    try {
      const sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();

      // Enforce safe raster formats only (strictly reject SVG, GIF, PDF, etc.)
      const allowedFormats = ['jpeg', 'png', 'webp'];
      if (!metadata.format || !allowedFormats.includes(metadata.format)) {
        return NextResponse.json(
          { message: 'Invalid format. Only JPEG, PNG, and WebP images are permitted.' },
          { status: 400 }
        );
      }

      // Enforce reasonable dimension limits (max 4096 x 4096 px)
      if ((metadata.width && metadata.width > 4096) || (metadata.height && metadata.height > 4096)) {
        return NextResponse.json(
          { message: 'Image dimensions exceed maximum allowed size (4096x4096px).' },
          { status: 400 }
        );
      }

      // Re-encode into clean WebP: resize to avatar dimensions (512x512), strip all EXIF metadata
      cleanWebpBuffer = await sharpInstance
        .resize({ width: 512, height: 512, fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (decodeErr: any) {
      console.error('Image decoding / re-encoding failed:', decodeErr.message);
      return NextResponse.json(
        { message: 'Failed to process image. File is corrupted or contains an invalid structure.' },
        { status: 400 }
      );
    }

    let profilePictureUrl = '';

    // Prefer Cloudinary for production cloud storage if configured
    if (isCloudinaryConfigured()) {
      try {
        profilePictureUrl = await uploadToCloudinary(cleanWebpBuffer, userId);
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to local file storage:', cloudErr);
      }
    }

    // Fall back to local file storage if Cloudinary is unconfigured or failed
    if (!profilePictureUrl) {
      try {
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filename = `${userId}-${Date.now()}.webp`;
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, cleanWebpBuffer);

        profilePictureUrl = `/uploads/${filename}`;
      } catch (fsErr) {
        console.error('Local filesystem write failed:', fsErr);
        // Do NOT store huge Base64 strings in MongoDB
        return NextResponse.json(
          { message: 'Storage unavailable: Could not save image to persistent storage. Base64 database storage is disabled.' },
          { status: 500 }
        );
      }
    }

    // Update user's profile picture in database with clean URL
    const { db } = await connectToDatabase();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { profilePicture: profilePictureUrl } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { profilePicture: profilePictureUrl },
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