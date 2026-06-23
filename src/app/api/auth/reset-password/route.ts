import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { icNumber, phone, newPassword } = await req.json();

    if (!icNumber || !phone || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the engineer with matching IC and Phone
    const engineer = await prisma.engineer.findFirst({
      where: {
        icNumber,
        phone
      }
    });

    if (!engineer) {
      // Return a generic error to prevent data mining
      return NextResponse.json({ error: 'Identity verification failed. Please check your IC and Phone Number.' }, { status: 401 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await prisma.engineer.update({
      where: { id: engineer.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully' });

  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
