import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";
import { isValidEmail } from "@/utils/validation";

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

    // Validate email if provided
    if (data.email && !isValidEmail(data.email)) {
      return NextResponse.json(
        { error: "Email tidak valid." },
        { status: 400 }
      );
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
    };

    // Update department if provided
    if (data.department_id) {
      updateData.department = {
        connect: { department_id: parseInt(data.department_id, 10) },
      };
    } else {
      updateData.department = {
        disconnect: true,
      };
    }

    // Update position if provided
    if (data.position_id) {
      updateData.position = {
        connect: { position_id: parseInt(data.position_id, 10) },
      };
    } else {
      updateData.position = {
        disconnect: true,
      };
    }

    const updatedEmployee = await prisma.employee.update({
      where: {
        employee_id: parseInt(params.id, 10),
      },
      data: updateData,
      include: {
        department: true,
        position: true,
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
