import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";
import { isValidEmail } from "@/utils/validation";

const prisma = new PrismaClient();

export async function GET() {
  const authResponse = await withAuth();
  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const employeesRaw = await prisma.employee.findMany({
      include: {
        department: true,
        position: true,
      },
    });

    // Format the employees data to match what the frontend expects
    const employees = employeesRaw.map((employee) => ({
      employee_id: employee.employee_id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department_name: employee.department?.name || null,
      position_name: employee.position?.name || null,
      department_id: employee.department_id,
      position_id: employee.position_id,
    }));

    const departments = await prisma.department.findMany({
      select: {
        department_id: true,
        name: true,
      },
    });

    const positions = await prisma.position.findMany({
      select: {
        position_id: true,
        name: true,
        department_id: true,
      },
    });

    return NextResponse.json(
      {
        employees: employees,
        departments: departments,
        positions: positions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResponse = await withAuth();
  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const { name, email, phone, department_id, position_id } =
      await request.json();

    if (!name || !email || !department_id || !position_id) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Email invalid" }, { status: 400 });
    }

    const newEmployee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        department_id: Number(department_id),
        position_id: Number(position_id),
      },
    });

    return NextResponse.json(
      { message: "Employee added successfully", employee: newEmployee },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding employee:", error);
    return NextResponse.json(
      { message: "Failed to add employee" },
      { status: 500 }
    );
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

    const result = await prisma.employee.deleteMany({
      where: {
        employee_id: {
          in: ids.map((id) => parseInt(id)),
        },
      },
    });

    return NextResponse.json(
      {
        message: "Employees deleted successfully",
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting employees:", error);
    return NextResponse.json(
      { message: "Failed to delete employees" },
      { status: 500 }
    );
  }
}
