import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { sendTeamsNotification } from "@/lib/teamsnotifications";

const prisma = new PrismaClient();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function PUT(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const userWithSecurity = await prisma.users.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        security: true,
      },
    });

    if (session.user.role !== "security" || !userWithSecurity?.security) {
      return NextResponse.json(
        { error: "Access denied: Security role required" },
        { status: 403 }
      );
    }

    if (!userWithSecurity?.security) {
      return NextResponse.json(
        { error: "Security information not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const checkInTime = new Date();
    const [hours, minutes] = timeString.split(":");
    checkInTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const updatedVisit = await prisma.visit.update({
      where: {
        visit_id: parseInt(params.id, 10),
      },
      data: {
        check_in_time: checkInTime,
        verification_status: true,
        security: {
          connect: {
            security_id: userWithSecurity.security.security_id,
          },
        },
      },
      include: {
        visitor: {
          include: {
            company: true,
          },
        },
        employee: true,
        security: true,
        teammember: true,
      },
    });

    if (updatedVisit.employee_id) {
      const employeeData = await prisma.employee.findUnique({
        where: {
          employee_id: updatedVisit.employee_id,
        },
        select: {
          email: true,
          name: true,
        },
      });

      const employeeUser = await prisma.users.findFirst({
        where: {
          employee_id: updatedVisit.employee_id,
        },
        include: {
          employee: true,
        },
      });

      const message = `${updatedVisit.visitor?.name} from ${updatedVisit.visitor?.company.company_name} has checked in for their visit`;

      try {
        await delay(1000);

        if (employeeUser) {
          await sendNotification(employeeUser.user_id, message);
          console.log(
            `In-app notification sent to employee ${employeeUser.user_id}`
          );
        }

        if (employeeData?.email) {
          await sendTeamsNotification(employeeData.email, message);
          console.log(`Teams notification sent to ${employeeData.email}`);
        }
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }

    return NextResponse.json(updatedVisit);
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}
