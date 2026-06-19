import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId || sessionId === 'true') {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const engineer = await prisma.engineer.findUnique({
      where: { id: sessionId }
    });

    if (!engineer) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      name: engineer.firstName,
      icNumber: engineer.icNumber,
      phone: engineer.phone
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, message: 'Server error' }, { status: 500 });
  }
}
