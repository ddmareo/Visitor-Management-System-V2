import { withAuth } from "@/lib/with-auth";
import { formatPlatNomor, isValidPlatNomor } from "@/utils/validation";
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

    let vehicleNumber: string | null = null;
    if (data.vehicle_number?.trim()) {
      if (!isValidPlatNomor(data.vehicle_number)) {
        return NextResponse.json(
          { error: "Format plat nomor tidak valid." },
          { status: 400 }
        );
      }
      vehicleNumber = formatPlatNomor(data.vehicle_number.trim());
    }

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
        vehicle_number: vehicleNumber || null,
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
