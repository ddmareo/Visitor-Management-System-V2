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
    const updatedEmployee = await prisma.employee.update({
      where: {
        employee_id: parseInt(params.id, 10),
      },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        position: data.position,
      },
    });
    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Error updating employee" },
      { status: 500 }
    );
  }
}
