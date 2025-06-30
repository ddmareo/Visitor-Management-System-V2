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
    const updatedSecurity = await prisma.security.update({
      where: {
        security_id: parseInt(params.id, 10),
      },
      data: {
        security_name: data.security_name,
      },
    });
    return NextResponse.json(updatedSecurity);
  } catch (error) {
    console.error("Error updating security:", error);
    return NextResponse.json(
      { error: "Error updating security" },
      { status: 500 }
    );
  }
}
