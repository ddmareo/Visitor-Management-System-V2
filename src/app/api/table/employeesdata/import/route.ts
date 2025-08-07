import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { withAuth } from "@/lib/with-auth";
import { isValidEmail } from "@/utils/validation";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await withAuth();

  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    const text = await file.text();

    try {
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const requiredColumns = [
        "name",
        "email",
        "phone",
        "department",
        "position",
      ];

      const missingColumns = requiredColumns.filter(
        (col) => !Object.keys(records[0]).includes(col)
      );

      if (missingColumns.length > 0) {
        return NextResponse.json(
          {
            message: `Missing required columns: ${missingColumns.join(", ")}`,
          },
          { status: 400 }
        );
      }

      const validationErrors: string[] = [];
      const validRecords: any[] = [];

      records.forEach(
        (
          record: {
            name: string;
            email: string;
            phone: string;
            department: string;
            position: string;
          },
          index: number
        ) => {
          const rowErrors: string[] = [];

          if (!isValidEmail(record.email)) {
            rowErrors.push(`Invalid email format: ${record.email}`);
          }

          if (!record.name?.trim()) {
            rowErrors.push("Name is required");
          }

          if (rowErrors.length > 0) {
            validationErrors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`); // +2 because index starts at 0 and first row is header
          } else {
            validRecords.push({
              name: record.name.trim(),
              email: record.email.trim().toLowerCase(),
              phone: record.phone.trim(),
              department: record.department.trim(),
              position: record.position.trim(),
            });
          }
        }
      );

      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            message: "Validation errors found",
            errors: validationErrors,
            validRecords: validRecords.length,
            totalRecords: records.length,
          },
          { status: 400 }
        );
      }

      const result = await prisma.employee.createMany({
        data: validRecords,
        skipDuplicates: true,
      });

      return NextResponse.json({
        message: "CSV import successful",
        imported: result.count,
        validated: validRecords.length,
      });
    } catch (parseError) {
      console.error("Error parsing CSV file:", parseError);
      return NextResponse.json(
        { message: "Error parsing CSV file" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error handling file upload:", error);
    return NextResponse.json(
      { message: "Error handling file upload" },
      { status: 500 }
    );
  }
}
