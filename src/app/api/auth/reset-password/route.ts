import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, code, and new password are required" },
        { status: 400 }
      );
    }

    // Find the engineer by email
    const engineer = await prisma.engineer.findUnique({
      where: { email },
    });

    if (!engineer) {
      return NextResponse.json(
        { error: "No account found with that Email" },
        { status: 404 }
      );
    }

    if (engineer.resetCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 401 }
      );
    }

    if (!engineer.resetCodeExpiresAt || engineer.resetCodeExpiresAt < new Date()) {
        return NextResponse.json(
            { error: "Verification code has expired. Please request a new one." },
            { status: 401 }
        );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the database and clear the reset code
    await prisma.engineer.update({
      where: { email },
      data: { 
          password: hashedPassword,
          resetCode: null,
          resetCodeExpiresAt: null
      },
    });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting the password" },
      { status: 500 }
    );
  }
}
