import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decryptBinary } from "@/utils/encryption";

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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session?.user?.role !== "security" &&
        session?.user?.role !== "admin" &&
        session?.user?.role !== "sec_admin")
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const visitorId = parseInt(params.id, 10);

    const visitor = await prisma.visitor.findUnique({
      where: {
        visitor_id: visitorId,
      },
      select: {
        id_card: true,
      },
    });

    if (!visitor || !visitor.id_card) {
      return NextResponse.json({ error: "ID card not found" }, { status: 404 });
    }

    const encryptedImageData = Buffer.from(visitor.id_card);
    const decryptedImageData = decryptBinary(encryptedImageData);

    const contentType = detectImageType(decryptedImageData);

    const response = new NextResponse(decryptedImageData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": decryptedImageData.length.toString(),
        "Cache-Control": "public, max-age=31536000",
      },
    });

    return response;
  } catch (error) {
    console.error("Error fetching ID card:", error);
    return NextResponse.json(
      { error: "Failed to fetch ID card" },
      { status: 500 }
    );
  }
}
