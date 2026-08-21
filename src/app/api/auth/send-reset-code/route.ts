import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || "mock");

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration 15 mins from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save to DB
    await prisma.engineer.update({
        where: { email },
        data: {
            resetCode: code,
            resetCodeExpiresAt: expiresAt
        }
    });

    // Send email
    if (process.env.RESEND_API_KEY) {
        try {
            await resend.emails.send({
                from: 'AI Solar OS <onboarding@resend.dev>',
                to: email,
                subject: 'Password Reset Verification Code',
                html: `
                    <h1>Password Reset</h1>
                    <p>Your verification code is: <strong>${code}</strong></p>
                    <p>This code will expire in 15 minutes.</p>
                `
            });
        } catch (emailErr) {
            console.error("Failed to send email via Resend:", emailErr);
            return NextResponse.json(
                { error: "Failed to send verification email. Please contact support." },
                { status: 500 }
            );
        }
    } else {
        console.log(`[MOCK EMAIL] To: ${email} | Code: ${code}`);
    }

    return NextResponse.json({ success: true, message: "Verification code sent" });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while sending the code" },
      { status: 500 }
    );
  }
}
