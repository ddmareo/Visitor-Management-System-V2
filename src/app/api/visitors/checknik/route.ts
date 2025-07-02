import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { decrypt } from "@/utils/encryption";
import csrf from "csrf";

const tokens = new csrf();
const secret = process.env.CSRF_SECRET || tokens.secretSync();

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { nik, token, csrfToken } = await request.json();

  if (!tokens.verify(secret, csrfToken)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const verifyResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token }),
    }
  );
  const verifyResult = await verifyResponse.json();

  if (!verifyResult.success) {
    return NextResponse.json(
      { error: "Invalid security check" },
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
      const decryptedNik = decrypt(nik);
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
