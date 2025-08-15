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
    const updatedDepartment = await prisma.department.update({
      where: {
        department_id: parseInt(params.id, 10),
      },
      data: {
        name: data.name,
      },
    });
    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: "Error updating department" },
      { status: 500 }
    );
  }
}
