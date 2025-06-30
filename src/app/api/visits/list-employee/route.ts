import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

const visitCategoryMapping = {
  Meeting___Visits: "Meeting & Visits",
  Delivery: "Delivery",
  Working__Project___Repair_: "Working (Project & Repair)",
  VIP: "VIP",
} as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const userWithEmployee = await prisma.users.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        employee: true,
      },
    });

    if (session.user.role !== "user" || !userWithEmployee?.employee) {
      return NextResponse.json(
        { error: "Access denied: User role required" },
        { status: 403 }
      );
    }

    if (!userWithEmployee?.employee?.department) {
      return NextResponse.json(
        { error: "Department information not found" },
        { status: 404 }
      );
    }

    const visits = await prisma.visit.findMany({
      where: {
        employee: {
          department: userWithEmployee.employee.department,
        },
      },
      include: {
        visitor: {
          select: {
            name: true,
            company_id: true,
            company: {
              select: {
                company_name: true,
              },
            },
          },
        },
        employee: {
          select: {
            name: true,
            department: true,
          },
        },
        security: {
          select: {
            security_name: true,
          },
        },
      },
    });

    const transformedVisits = visits.map((visit) => {
      let status: "Pending" | "Ongoing" | "Completed";
      if (!visit.check_in_time && !visit.check_out_time) {
        status = "Pending";
      } else if (visit.check_in_time && !visit.check_out_time) {
        status = "Ongoing";
      } else {
        status = "Completed";
      }

      const startDate = visit.entry_start_date.toISOString();

      const mappedCategory =
        visitCategoryMapping[
          visit.visit_category as keyof typeof visitCategoryMapping
        ] || visit.visit_category;

      return {
        id: visit.visit_id.toString(),
        visitorName: visit.visitor?.name || "N/A",
        company: visit.visitor?.company?.company_name || "N/A",
        employeeName: visit.employee?.name || "N/A",
        department: visit.employee?.department || "N/A",
        startDate,
        category: mappedCategory,
        entryMethod: visit.entry_method,
        vehicleNumber: visit.vehicle_number || "",
        status,
      };
    });

    return new Response(JSON.stringify(transformedVisits), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch visits" }), {
      status: 500,
    });
  }
}
