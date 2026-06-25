import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const { image, name } = await req.json();

    if (!image || !image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const base64Data = image.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Add random suffix to avoid collisions
    const safeName = (name || 'upload').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `images/${safeName}-${Date.now()}.jpg`;

    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image', details: error.message }, { status: 500 });
  }
}
