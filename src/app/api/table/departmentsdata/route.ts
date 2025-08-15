import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";

const prisma = new PrismaClient();

export async function GET() {
  const authResponse = await withAuth();
  if (authResponse instanceof Response) return authResponse;

  try {
    const tableData = await prisma.department.findMany();
    return NextResponse.json(tableData, { status: 200 });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { message: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResponse = await withAuth();
  if (authResponse instanceof Response) return authResponse;

  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "Missing required field: name" },
        { status: 400 }
      );
    }

    const newDepartment = await prisma.department.create({
      data: { name },
    });

    return NextResponse.json(
      { message: "Department added successfully", department: newDepartment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding department:", error);
    return NextResponse.json(
      { message: "Failed to add department", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authResponse = await withAuth();
  if (authResponse instanceof Response) return authResponse;

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid or empty ids array" },
        { status: 400 }
      );
    }

    const departmentsWithEmployees = await prisma.department.findMany({
      where: { department_id: { in: ids.map(Number) } },
      include: { _count: { select: { employees: true } } },
    });

    const hasEmployees = departmentsWithEmployees.some(
      (dept) => dept._count.employees > 0
    );

    if (hasEmployees) {
      return NextResponse.json(
        {
          message:
            "Cannot delete departments that have associated employees. Please reassign or remove employees first.",
          error: "DEPARTMENT_HAS_EMPLOYEES",
        },
        { status: 400 }
      );
    }

    const result = await prisma.department.deleteMany({
      where: { department_id: { in: ids.map(Number) } },
    });

    return NextResponse.json(
      { message: "Departments deleted successfully", count: result.count },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { message: "Failed to delete department", error: error.message },
      { status: 500 }
    );
  }
}
