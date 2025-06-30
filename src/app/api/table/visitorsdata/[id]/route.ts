import { withAuth } from "@/lib/with-auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { encrypt } from "@/utils/encryption";

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

    const encryptedIdNumber =
      data.id_number !== undefined && data.id_number !== null
        ? encrypt(data.id_number)
        : undefined;

    const updatedVisitor = await prisma.visitor.update({
      where: {
        visitor_id: parseInt(params.id, 10),
      },
      data: {
        name: data.name,
        company_id: data.company_id,
        id_number: encryptedIdNumber,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        address: data.address,
      },
    });
    return NextResponse.json(updatedVisitor);
  } catch (error) {
    console.error("Error updating visitor", error);
    return NextResponse.json(
      { error: "Error updating visitor" },
      { status: 500 }
    );
  }
}
