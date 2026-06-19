import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { firstName, phone, icNumber, password } = await request.json();

    if (!firstName || !phone || !icNumber || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Check if engineer already exists
    const existing = await prisma.engineer.findUnique({ where: { icNumber } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Engineer with this IC Number already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const engineer = await prisma.engineer.create({
      data: {
        firstName,
        phone,
        icNumber,
        password: hashedPassword
      }
    });

    return NextResponse.json({ success: true, engineerId: engineer.id });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
