import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ message: "Database is connected" });
  } catch (error: any) {
    console.error("Database error:", error);

    if (error.code === "P1001") {
      return NextResponse.json(
        { error: "Database does not exist or cannot be reached" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
