import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

function detectImageType(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  return "image/jpeg";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.role !== "admin" &&
        session.user.role !== "security" &&
        session.user.role !== "sec_admin")
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const visitId = parseInt(params.id, 10);

    const visit = await prisma.visit.findUnique({
      where: {
        visit_id: visitId,
      },
      select: {
        safety_permit: true,
      },
    });

    if (!visit || !visit.safety_permit) {
      return NextResponse.json({ error: "ID card not found" }, { status: 404 });
    }

    const imageData = Buffer.from(visit.safety_permit);

    const contentType = detectImageType(imageData);

    const response = new NextResponse(imageData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": imageData.length.toString(),
        "Cache-Control": "public, max-age=31536000",
      },
    });

    return response;
  } catch (error) {
    console.error("Error fetching safety permit file:", error);
    return NextResponse.json(
      { error: "Failed to fetch safety permit file" },
      { status: 500 }
    );
  }
}
