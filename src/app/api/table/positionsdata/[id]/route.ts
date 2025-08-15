import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";

const prisma = new PrismaClient();

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
    const updatedPosition = await prisma.position.update({
      where: {
        position_id: parseInt(params.id, 10),
      },
      data: {
        name: data.name,
        department_id: data.department_id,
      },
    });
    return NextResponse.json(updatedPosition);
  } catch (error) {
    console.error("Error updating position:", error);
    return NextResponse.json(
      { error: "Error updating position" },
      { status: 500 }
    );
  }
}
