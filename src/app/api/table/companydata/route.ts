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
    const tableData = await prisma.company.findMany();
    return new Response(JSON.stringify(tableData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch company" }),
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
    const { company_name } = await request.json();

    if (!company_name) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newCompany = await prisma.company.create({
      data: {
        company_name,
      },
    });

    return NextResponse.json(
      { message: "Company added successfully", company: newCompany },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding company:", error);
    return NextResponse.json(
      { message: "Failed to add company" },
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

    const companiesWithVisitors = await prisma.company.findMany({
      where: {
        company_id: {
          in: ids.map((id) => parseInt(id)),
        },
      },
      include: {
        _count: {
          select: {
            visitor: true,
          },
        },
      },
    });

    const hasAssociatedVisitors = companiesWithVisitors.some(
      (company) => company._count.visitor > 0
    );

    if (hasAssociatedVisitors) {
      return NextResponse.json(
        {
          message:
            "Cannot delete companies that have associated visitors. Please delete or reassign the visitors first.",
          error: "COMPANY_HAS_VISITORS",
        },
        { status: 400 }
      );
    }

    const result = await prisma.company.deleteMany({
      where: {
        company_id: {
          in: ids.map((id) => parseInt(id)),
        },
      },
    });

    return NextResponse.json(
      {
        message: "Company deleted successfully",
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { message: "Failed to delete company" },
      { status: 500 }
    );
  }
}
