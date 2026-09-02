import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_session");

    if (!token || !token.value || token.value === 'true') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const engineerId = token.value;

    const { ticketId, action } = await req.json();

    if (!ticketId || !action) {
      return NextResponse.json({ error: "Ticket ID and action are required" }, { status: 400 });
    }

    if (action === "CLAIM") {
      const ticket = await prisma.consultationTicket.update({
        where: { id: ticketId },
        data: {
          status: "CLAIMED",
          claimedById: engineerId
        }
      });
      return NextResponse.json({ success: true, ticket });
    } else if (action === "RESOLVE") {
      const ticket = await prisma.consultationTicket.update({
        where: { id: ticketId, claimedById: engineerId }, // Ensure only the owner can resolve
        data: {
          status: "RESOLVED"
        }
      });
      return NextResponse.json({ success: true, ticket });
    } else if (action === "UNCLAIM") {
      const ticket = await prisma.consultationTicket.update({
        where: { id: ticketId, claimedById: engineerId },
        data: {
          status: "OPEN",
          claimedById: null
        }
      });
      return NextResponse.json({ success: true, ticket });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Claim ticket error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
