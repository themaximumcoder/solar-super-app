import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const count = await prisma.report.count();
        return NextResponse.json({ count });
    } catch (e) {
        return NextResponse.json({ count: 0 });
    }
}
