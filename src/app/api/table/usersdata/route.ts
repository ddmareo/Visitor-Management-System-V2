import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const tableData = await prisma.users.findMany({
      include: {
        employee: {
          select: {
            name: true,
          },
        },
        security: {
          select: {
            security_name: true,
          },
        },
      },
    });

    const employees = await prisma.employee.findMany({
      select: { employee_id: true, name: true },
    });

    const security = await prisma.security.findMany({
      select: { security_id: true, security_name: true },
    });

    const transformedUsers = tableData.map((user) => ({
      ...user,
      employee_name: user.employee?.name || "N/A",
      security_name: user.security?.security_name || "N/A",
      employee: undefined,
      security: undefined,
    }));

    const responseData = {
      users: transformedUsers,
      employees: employees,
      security: security,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { username, password, role, employee_id, security_id } =
      await request.json();

    if (!username || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const newUser = await prisma.users.create({
      data: {
        username,
        password: hashedPassword,
        role,
        employee_id,
        security_id,
      },
      select: {
        user_id: true,
        username: true,
        role: true,
        employee_id: true,
        security_id: true,
      },
    });

    return NextResponse.json(
      {
        message: "User added successfully",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding user:", error);
    return NextResponse.json(
      { message: "Failed to add user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid or empty ids array" },
        { status: 400 }
      );
    }

    const result = await prisma.users.deleteMany({
      where: {
        user_id: {
          in: ids.map((id) => parseInt(id)),
        },
      },
    });

    return NextResponse.json(
      {
        message: "User deleted successfully",
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
