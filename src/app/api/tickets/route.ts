import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

// POST: Public submission of a new consultation ticket
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { customerName, contactInfo, address, issueDescription, ticketType, scheduledDate, scheduledTime } = data;

    if (!customerName || !contactInfo || !address || !issueDescription) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const ticket = await prisma.consultationTicket.create({
      data: {
        customerName,
        contactInfo,
        address,
        issueDescription,
        ticketType: ticketType || "CONSULTATION",
        scheduledDate,
        scheduledTime,
        status: "OPEN"
      }
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while submitting the ticket" },
      { status: 500 }
    );
  }
}

// GET: List tickets (Requires Engineer Login)
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_session");

    if (!token || !token.value || token.value === 'true') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const engineerId = token.value;

    // Get OPEN tickets and tickets CLAIMED by this engineer
    const openTickets = await prisma.consultationTicket.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" }
    });

    const myTickets = await prisma.consultationTicket.findMany({
      where: { 
          claimedById: engineerId 
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ openTickets, myTickets });
  } catch (error) {
    console.error("List tickets error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 401 }
    );
  }
}
