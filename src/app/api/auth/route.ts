import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { icNumber, password } = await request.json()

    const engineer = await prisma.engineer.findUnique({ where: { icNumber } })
    
    if (engineer) {
      const isMatch = await bcrypt.compare(password, engineer.password)
      if (isMatch) {
        const cookieStore = await cookies()
        cookieStore.set('auth_session', engineer.id, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 1 week
        })
        return NextResponse.json({ success: true })
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid IC Number or password' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
