import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";

const prisma = new PrismaClient();

const visitCategoryMapping = {
  Meeting___Visits: "Meeting & Visits",
  Delivery: "Delivery",
  Working__Project___Repair_: "Working (Project & Repair)",
  VIP: "VIP",
} as const;

export async function GET() {
  const authResponse = await withAuth();

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const visits = await prisma.visit.findMany({
      orderBy: {
        entry_start_date: "desc",
      },

      include: {
        visitor: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            name: true,
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { safety_permit, visitor, employee, security, ...rest } = visit;

      return {
        ...rest,
        visitor_name: visitor?.name || "N/A",
        employee_name: employee?.name || "N/A",
        security_name: security?.security_name || "N/A",
        visit_category:
          visitCategoryMapping[
            visit.visit_category as keyof typeof visitCategoryMapping
          ] || visit.visit_category,
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

export async function DELETE(request: Request) {
  const authResponse = await withAuth();

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid or empty ids array" },
        { status: 400 }
      );
    }

    const result = await prisma.visit.deleteMany({
      where: {
        visit_id: {
          in: ids.map((id) => parseInt(id)),
        },
      },
    });

    return NextResponse.json(
      {
        message: "Visitors deleted successfully",
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting visitors:", error);
    return NextResponse.json(
      { message: "Failed to delete visitors" },
      { status: 500 }
    );
  }
}
