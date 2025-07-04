//qr
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

export async function GET(
  _request: Request,
  { params }: { params: { qrCode: string } }
) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session?.user?.role !== "security" &&
      session?.user?.role !== "admin" &&
      session?.user?.role !== "sec_admin")
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { qrCode } = params;

  if (!qrCode) {
    return new Response(JSON.stringify({ error: "QR code is required" }), {
      status: 400,
    });
  }

  try {
    const visit = await prisma.visit.findFirst({
      where: { qr_code: qrCode },
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
            face_descriptor: true,
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
        teammember: {
          select: {
            member_name: true,
          },
        },
      },
    });

    if (!visit) {
      return new Response(JSON.stringify({ error: "Visitor not found" }), {
        status: 404,
      });
    }

    const mappedCategory =
      visitCategoryMapping[
        visit.visit_category as keyof typeof visitCategoryMapping
      ] || visit.visit_category;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { safety_permit, ...visitWithoutSafetyPermit } = visit;

    const transformedVisit = {
      ...visitWithoutSafetyPermit,
      visitor_name: visit.visitor?.name || "-",
      employee_name: visit.employee?.name || "-",
      security_name: visit.security?.security_name || "-",
      company_institution: visit.visitor?.company?.company_name,
      team_members: visit.teammember.map((member) => member.member_name),
      visit_category: mappedCategory,
      face_descriptor: visit.visitor?.face_descriptor || null,
    };

    return new Response(JSON.stringify(transformedVisit), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching visit by QR code:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch visit" }), {
      status: 500,
    });
  }
}
