import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();

    //To fix the hashed password getting hashed, so the code matches the existing password first with the new password
    const existingUser = await prisma.users.findUnique({
      where: {
        user_id: parseInt(params.id, 10),
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordToUpdate = data.password
      ? data.password !== existingUser.password
        ? await hash(data.password, 12)
        : data.password
      : undefined;

    const updatedUser = await prisma.users.update({
      where: {
        user_id: parseInt(params.id, 10),
      },
      data: {
        username: data.username,
        password: passwordToUpdate,
        role: data.role,
        employee_id: data.employee_id,
        security_id: data.security_id,
      },
      select: {
        user_id: true,
        username: true,
        role: true,
        employee_id: true,
        security_id: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user", error);
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}
