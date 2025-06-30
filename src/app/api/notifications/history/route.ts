import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        message: true,
        created_at: true,
      },
    });

    const unreadCount = await prisma.notifications.count({
      where: {
        user_id: userId,
        mark_read: false,
      },
    });

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const notifupdate = await prisma.notifications.updateMany({
      where: {
        user_id: userId,
      },
      data: {
        mark_read: true,
      },
    });

    return NextResponse.json({ notifupdate }, { status: 200 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const notifupdate = await prisma.notifications.deleteMany({
      where: {
        user_id: userId,
      },
    });

    return NextResponse.json({ notifupdate }, { status: 200 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
