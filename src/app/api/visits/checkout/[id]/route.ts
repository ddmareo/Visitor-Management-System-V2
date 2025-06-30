import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "security") {
      return NextResponse.json(
        { error: "Access denied: Security role required" },
        { status: 403 }
      );
    }

    // Get the current time formatted as HH:mm
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    // Convert timeString to a Date object with only time set
    const checkOutTime = new Date();
    const [hours, minutes] = timeString.split(":");
    checkOutTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    // Update only the check_out_time
    const updatedVisit = await prisma.visit.update({
      where: {
        visit_id: parseInt(params.id, 10),
      },
      data: {
        check_out_time: checkOutTime,
      },
      include: {
        visitor: true,
        employee: true,
        security: true,
        teammember: true,
      },
    });

    return NextResponse.json(updatedVisit);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 }
    );
  }
}
