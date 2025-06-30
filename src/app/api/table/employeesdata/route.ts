import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";

const prisma = new PrismaClient();

export async function GET() {
  const authResponse = await withAuth();

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const tableData = await prisma.employee.findMany();
    return new Response(JSON.stringify(tableData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch employees" }),
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  const authResponse = await withAuth();

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const { name, position, email, phone, department } = await request.json();

    if (!name || !position || !email || !phone || !department) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newEmployee = await prisma.employee.create({
      data: {
        name,
        position,
        email,
        phone,
        department,
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
