import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "sec_admin")
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const visitId = parseInt(params.id, 10);

    const visit = await prisma.visit.findUnique({
      where: {
        visit_id: visitId,
      },
      select: {
        qr_code: true,
      },
    });

    if (!visit || !visit.qr_code) {
      return NextResponse.json({ error: "QR Code not found" }, { status: 404 });
    }

    const qrCodeURL = `${visit.qr_code}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeURL);

    return NextResponse.json({
      status: 201,
      qrCodeImage: qrCodeDataURL,
    });
  } catch (error) {
    console.error("Error fetching QR Code:", error);
    return NextResponse.json(
      { error: "Failed to fetch QR Code" },
      { status: 500 }
    );
  }
}
