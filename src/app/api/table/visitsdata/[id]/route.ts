import { withAuth } from "@/lib/with-auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const visitCategoryMapping = {
  "Meeting & Visits": "Meeting___Visits",
  Delivery: "Delivery",
  "Working (Project & Repair)": "Working__Project___Repair_",
  VIP: "VIP",
} as const;

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResponse = await withAuth();

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const data = await req.json();
    const updatedVisit = await prisma.visit.update({
      where: {
        visit_id: parseInt(params.id, 10),
      },
      data: {
        visit_category:
          visitCategoryMapping[
            data.visit_category as keyof typeof visitCategoryMapping
          ] || data.visit_category,
        entry_start_date: new Date(data.entry_start_date),
        entry_method: data.entry_method,
        vehicle_number: data.vehicle_number || null,
      },
    });
    return NextResponse.json(updatedVisit);
  } catch (error) {
    console.error("Error updating visitor:", error);
    return NextResponse.json(
      { error: "Error updating visit" },
      { status: 500 }
    );
  }
}
