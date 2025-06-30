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
    const tableData = await prisma.security.findMany();
    return new Response(JSON.stringify(tableData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching security:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch security" }), {
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  const authResponse = await withAuth();

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const { security_name } = await request.json();

    if (!security_name) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newSecurity = await prisma.security.create({
      data: {
        security_name,
      },
    });

    return NextResponse.json(
      { message: "Security added successfully", security: newSecurity },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding security:", error);
    return NextResponse.json(
      { message: "Failed to add security" },
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

    const result = await prisma.security.deleteMany({
      where: {
        security_id: {
          in: ids.map((id) => parseInt(id)),
        },
      },
    });

    return NextResponse.json(
      {
        message: "Security deleted successfully",
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting security:", error);
    return NextResponse.json(
      { message: "Failed to delete security" },
      { status: 500 }
    );
  }
}
