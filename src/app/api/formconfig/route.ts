import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultFormFields = [
  {
    id: "email",
    label: "Email",
    enabled: true,
    required: true,
    type: "email",
  },
  {
    id: "address",
    label: "Alamat Lengkap",
    enabled: true,
    required: true,
    type: "text",
  },
  {
    id: "idCard",
    label: "Pindaian Kartu Identitas (Scan KTP)",
    enabled: true,
    required: true,
    type: "file",
  },
];

export async function GET() {
  try {
    let config = await prisma.formConfig.findFirst();

    if (!config) {
      config = await prisma.formConfig.create({
        data: {
          id: 1,
          fields: defaultFormFields,
        },
      });
    }

    if (
      config &&
      (!config.fields ||
        (Array.isArray(config.fields) && config.fields.length === 0))
    ) {
      config = await prisma.formConfig.update({
        where: { id: 1 },
        data: {
          fields: defaultFormFields,
        },
      });
    }

    return NextResponse.json(config.fields);
  } catch (error) {
    console.error("Error in GET /api/formconfig:", error);
    return NextResponse.json(
      { error: "Failed to fetch form configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { fields } = await request.json();

    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: "Invalid fields data provided" },
        { status: 400 }
      );
    }

    const config = await prisma.formConfig.upsert({
      where: { id: 1 },
      update: { fields },
      create: {
        id: 1,
        fields,
      },
    });

    return NextResponse.json({
      message: "Configuration saved successfully",
      fields: config.fields,
    });
  } catch (error) {
    console.error("Error in POST /api/formconfig:", error);
    return NextResponse.json(
      { error: "Failed to save form configuration" },
      { status: 500 }
    );
  }
}
