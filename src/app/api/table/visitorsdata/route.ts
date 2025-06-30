import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";
import { decrypt } from "@/utils/encryption";

const prisma = new PrismaClient();

export async function GET() {
  const authResponse = await withAuth();

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const tableData = await prisma.visitor.findMany({
      orderBy: {
        registration_date: "desc",
      },
      include: {
        company: {
          select: {
            company_name: true,
          },
        },
      },
    });

    const companies = await prisma.company.findMany({
      select: {
        company_id: true,
        company_name: true,
      },
    });

    const formattedData = tableData.map((visitor) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id_card, ...rest } = visitor;

      return {
        ...rest,
        id_number: visitor.id_number ? decrypt(visitor.id_number) : null,
        company_name: visitor.company?.company_name || null,
      };
    });

    return NextResponse.json(
      {
        visitors: formattedData,
        company: companies,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Failed to fetch data" },
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

    const result = await prisma.visitor.deleteMany({
      where: {
        visitor_id: {
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
