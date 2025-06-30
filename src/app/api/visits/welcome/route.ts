export const dynamic = "force-dynamic";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const visitCategoryMapping = {
  Meeting___Visits: "Meeting & Visits",
  Delivery: "Delivery",
  Working__Project___Repair_: "Working (Project & Repair)",
  VIP: "VIP",
} as const;

export async function GET(request: Request) {
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  const encoder = new TextEncoder();

  writer.write(encoder.encode(`data: Connected to visitor stream\n\n`));

  const sendRecentVisitor = async () => {
    try {
      const recentVisit = await prisma.visit.findFirst({
        where: {
          check_in_time: { not: null },
          check_out_time: null,
          visitor_id: { not: null },
        },
        orderBy: { check_in_time: "desc" },
        include: {
          visitor: {
            include: {
              company: {
                select: { company_name: true },
              },
            },
          },
          teammember: { select: { member_name: true } },
        },
      });

      if (!recentVisit || !recentVisit.visitor) {
        return;
      }

      const mappedCategory =
        visitCategoryMapping[
          recentVisit.visit_category as keyof typeof visitCategoryMapping
        ] || recentVisit.visit_category;

      const eventData = {
        visitorName: recentVisit.visitor.name,
        checkInTime: recentVisit.check_in_time,
        visitCategory: mappedCategory,
        teamMembers: recentVisit.teammember.map((member) => member.member_name),
        companyName: recentVisit.visitor.company.company_name,
      };

      // Send the data as an SSE event
      writer.write(encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`));
    } catch (error) {
      console.error("Error fetching recent visitor:", error);
    }
  };

  await sendRecentVisitor();

  const intervalId = setInterval(sendRecentVisitor, 5000);

  request.signal.addEventListener("abort", () => {
    clearInterval(intervalId);
    writer.close();
    prisma.$disconnect();
  });

  return new Response(responseStream.readable, { headers });
}
