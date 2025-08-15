import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";

const prisma = new PrismaClient();

export async function GET() {
  const authResponse = await withAuth();
  if (authResponse instanceof Response) return authResponse;

  try {
    const positions = await prisma.position.findMany({
      include: {
        department: {
          select: { name: true },
        },
      },
    });

    const departments = await prisma.department.findMany({
      select: {
        department_id: true,
        name: true,
      },
    });

    const formattedData = positions.map((position) => ({
      position_id: position.position_id,
      name: position.name,
      department_name: position.department.name,
      department_id: position.department_id,
    }));

    return NextResponse.json(
      {
        positions: formattedData,
        department: departments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      { message: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResponse = await withAuth();
  if (authResponse instanceof Response) return authResponse;

  try {
    const { name, department_id } = await request.json();

    if (!name || !department_id) {
      return NextResponse.json(
        { message: "Missing required fields: name, department_id" },
        { status: 400 }
      );
    }

    const newPosition = await prisma.position.create({
      data: {
        name,
        department_id: Number(department_id),
      },
    });

    return NextResponse.json(
      { message: "Position added successfully", position: newPosition },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding position:", error);
    return NextResponse.json(
      { message: "Failed to add position", error: error.message },
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

    const positionsWithEmployees = await prisma.position.findMany({
      where: { position_id: { in: ids.map(Number) } },
      include: { _count: { select: { employees: true } } },
    });

    const hasEmployees = positionsWithEmployees.some(
      (pos) => pos._count.employees > 0
    );

    if (hasEmployees) {
      return NextResponse.json(
        {
          message:
            "Cannot delete positions that have associated employees. Please reassign or remove employees first.",
          error: "POSITION_HAS_EMPLOYEES",
        },
        { status: 400 }
      );
    }

    const result = await prisma.position.deleteMany({
      where: { position_id: { in: ids.map(Number) } },
    });

    return NextResponse.json(
      { message: "Positions deleted successfully", count: result.count },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting position:", error);
    return NextResponse.json(
      { message: "Failed to delete position", error: error.message },
      { status: 500 }
    );
  }
}
