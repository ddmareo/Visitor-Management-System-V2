import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function withAuth() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session.user.role !== "admin" && session.user.role !== "sec_admin")
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return session;
}
