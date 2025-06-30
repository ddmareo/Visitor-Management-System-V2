export const dynamic = "force-dynamic";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { format, toZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();

const visitCategoryMapping = {
  Meeting___Visits: "Meeting & Visits",
  Delivery: "Delivery",
  Working__Project___Repair_: "Working (Project & Repair)",
  VIP: "VIP",
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session?.user?.role !== "admin" && session?.user?.role !== "sec_admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const jakartaTimeZone = "Asia/Jakarta";
    const todayInJakarta = toZonedTime(new Date(), jakartaTimeZone);
    const formattedToday = format(todayInJakarta, "yyyy-MM-dd", {
      timeZone: jakartaTimeZone,
    });

    const startOfDay = new Date(formattedToday);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const visits = await prisma.visit.findMany({
      where: {
        entry_start_date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        visitor_id: {
          not: null,
        },
      },
      include: {
        visitor: {
          include: {
            company: {
              select: { company_name: true },
            },
          },
        },
        teammember: {
          select: {
            member_name: true,
          },
        },
      },
      take: 10,
    });

    const mappedVisitors = visits
      .map((visit) => {
        if (!visit.visitor) {
          return null;
        }

        const mappedCategory =
          visitCategoryMapping[
            visit.visit_category as keyof typeof visitCategoryMapping
          ] || visit.visit_category;

        return {
          visitorName: visit.visitor.name,
          visitCategory: mappedCategory,
          teamMembers: visit.teammember.map((member) => member.member_name),
          companyName: visit.visitor.company.company_name,
        };
      })
      .filter(
        (visitor): visitor is NonNullable<typeof visitor> => visitor !== null
      );

    return NextResponse.json({
      success: true,
      data: mappedVisitors,
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitors" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
