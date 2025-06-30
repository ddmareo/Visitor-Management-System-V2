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
    const tableData = await prisma.teammember.findMany();
    return new Response(JSON.stringify(tableData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch visitors" }), {
      status: 500,
    });
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

    const result = await prisma.teammember.deleteMany({
      where: {
        team_member_id: {
          in: ids.map((id) => parseInt(id)),
        },
      },
    });

    return NextResponse.json(
      {
        message: "Visitors deleted successfully",
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting visitors:", error);
    return NextResponse.json(
      { message: "Failed to delete visitors" },
      { status: 500 }
    );
  }
}
