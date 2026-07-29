import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { icNumber, phone, newPassword } = await req.json();

    if (!icNumber || !phone || !newPassword) {
      return NextResponse.json(
        { error: "IC Number, Phone Number, and New Password are required" },
        { status: 400 }
      );
    }

    // Clean formatting to ensure matching works correctly
    const cleanIc = icNumber.replace(/-/g, '');
    const cleanPhone = phone.replace(/[^0-9]/g, ''); // strip non-numeric characters just in case

    // Find the engineer by IC
    const engineer = await prisma.engineer.findUnique({
      where: { icNumber: cleanIc },
    });

    if (!engineer) {
      return NextResponse.json(
        { error: "No account found with that IC Number" },
        { status: 404 }
      );
    }

    // Verify phone number matches (stripping formatting to ensure a robust match)
    const dbPhone = engineer.phone.replace(/[^0-9]/g, '');
    if (dbPhone !== cleanPhone) {
      return NextResponse.json(
        { error: "The provided phone number does not match our records." },
        { status: 401 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the database
    await prisma.engineer.update({
      where: { icNumber: cleanIc },
      data: { password: hashedPassword },
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
