import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { decrypt } from "@/utils/encryption";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { nik: string } }
) {
  const encryptedNik = params.nik;

  if (!encryptedNik) {
    return NextResponse.json(
      { error: "NIK parameter is required" },
      { status: 400 }
    );
  }

  try {
    const visitors = await prisma.visitor.findMany({
      select: {
        id_number: true,
        name: true,
        company: { select: { company_name: true } },
      },
    });

    const matchedVisitor = visitors.find((visitor) => {
      const decryptedId = decrypt(visitor.id_number);
      const decryptedNik = decrypt(encryptedNik);
      return decryptedId === decryptedNik;
    });

    return NextResponse.json(
      {
        exists: !!matchedVisitor,
        visitor: matchedVisitor
          ? {
              name: matchedVisitor.name,
              company_name: matchedVisitor.company?.company_name || null,
            }
          : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
