import { NextResponse } from "next/server";
import {
  PrismaClient,
  new_visit_category_enum,
  entry_method_enum,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { sendNotification } from "@/lib/notifications";
import { sendTeamsNotification } from "@/lib/teamsnotifications";
import { decrypt } from "@/utils/encryption";
import sharp from "sharp";
import heicConvert from "heic-convert";
import csrf from "csrf";

const prisma = new PrismaClient();

const tokens = new csrf();
const secret = process.env.CSRF_SECRET || tokens.secretSync();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const visitCategoryMapping = {
  Meeting___Visits: "Meeting & Visits",
  Delivery: "Delivery",
  Working__Project___Repair_: "Working (Project & Repair)",
  VIP: "VIP",
} as const;

export async function GET(request: Request) {
  const csrfToken = request.headers.get("X-CSRF-Token");

  if (!csrfToken || csrfToken !== process.env.NEXT_PUBLIC_CSRF_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = request.headers.get("origin");
  const allowedOrigin = process.env.FRONTEND_URL;

  if (origin && allowedOrigin && !origin.startsWith(allowedOrigin)) {
    return new NextResponse(null, {
      status: 403,
      statusText: "Forbidden",
    });
  }

  try {
    const employees = await prisma.employee.findMany({
      select: { employee_id: true, name: true },
    });

    const visitCategories = Object.values(new_visit_category_enum);
    const entryMethods = Object.values(entry_method_enum);

    return NextResponse.json({
      employees,
      visitCategories,
      entryMethods,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const token = formData.get("token") as string;
    const csrfToken = formData.get("csrfToken") as string;

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    if (!tokens.verify(secret, csrfToken)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
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

    const visitor = formData.get("visitor") as string;
    const employee = parseInt(formData.get("employee") as string);
    const entry_start_date = new Date(
      formData.get("entry_start_date") as string
    );
    const category = formData.get("category") as new_visit_category_enum;
    const method = formData.get("method") as entry_method_enum;
    const vehicle = formData.get("vehicle") as string;
    const brings_team = formData.get("brings_team") === "true";
    const teammemberscount = brings_team
      ? parseInt(formData.get("teammemberscount") as string)
      : 0;

    const safetyPermitFile = formData.get("safety_permit") as File | null;

    let teammembers: string[] = [];
    const teammembersData = formData.get("teammembers");
    if (teammembersData) {
      teammembers = JSON.parse(teammembersData as string);
    }

    if (!employee || !entry_start_date || !category || !method) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let imageBuffer: Buffer | null = null;

    if (category === "Working__Project___Repair_") {
      if (!safetyPermitFile) {
        return NextResponse.json(
          { error: "Safety permit is required for high risk work" },
          { status: 400 }
        );
      }

      const fileArrayBuffer = await safetyPermitFile.arrayBuffer();
      const safetyPermitBuffer = Buffer.from(fileArrayBuffer);

      const fileName = safetyPermitFile.name.toLowerCase();

      if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
        try {
          const convertedBuffer = await heicConvert({
            buffer: safetyPermitBuffer as unknown as Buffer & ArrayBufferLike,
            format: "JPEG",
            quality: 1,
          });

          imageBuffer = Buffer.from(convertedBuffer);
        } catch (conversionError) {
          console.error("Error converting HEIC/HEIF:", conversionError);
          return NextResponse.json(
            { error: "Failed to process HEIC/HEIF image" },
            { status: 400 }
          );
        }
      } else {
        imageBuffer = safetyPermitBuffer;
      }
    }

    let compressedImageBuffer: Buffer | null = null;

    if (imageBuffer) {
      compressedImageBuffer = await sharp(imageBuffer)
        .resize({
          width: 1200,
          height: 900,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    }

    const decryptedNIK = await decrypt(visitor);

    const allVisitors = await prisma.visitor.findMany();

    const visitorRecord = allVisitors.find((v) => {
      const decryptedID = decrypt(v.id_number);
      return decryptedID === decryptedNIK;
    });

    if (!visitorRecord) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    const visitor_id = visitorRecord.visitor_id;

    const employeeRecord = await prisma.users.findFirst({
      where: { employee_id: employee },
      include: {
        employee: true,
      },
    });

    const employeeData = await prisma.employee.findUnique({
      where: { employee_id: employee },
      select: { email: true, name: true },
    });

    if (!employeeData) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const qrCodeUUID = uuidv4();
    const qrCodeURL = `${qrCodeUUID}`;

    const newVisit = await prisma.visit.create({
      data: {
        visitor_id,
        employee_id: employee,
        entry_start_date: entry_start_date,
        visit_category: category,
        entry_method: method,
        vehicle_number:
          method === "Vehicle_Roda_Dua" || method === "Vehicle_Roda_Empat"
            ? vehicle
            : null,
        team_members_quantity: teammemberscount || 0,
        qr_code: qrCodeUUID,
        brings_team: brings_team,
        safety_permit: compressedImageBuffer,
      },
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrCodeURL);

    if (brings_team && teammembers.length > 0) {
      const teamData = teammembers.map((member: string) => ({
        visit_id: newVisit.visit_id,
        member_name: member,
      }));
      await prisma.teammember.createMany({
        data: teamData,
      });
    }

    const formattedDate = entry_start_date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    try {
      await delay(1000);

      const notificationMessage = `${visitorRecord.name} has booked a visit on ${formattedDate} under ${visitCategoryMapping[category]}`;

      if (employeeRecord?.user_id) {
        await sendNotification(employeeRecord.user_id, notificationMessage);
      }

      if (employeeData.email) {
        await sendTeamsNotification(employeeData.email, notificationMessage);
        console.log(`Teams notification sent to ${employeeData.email}`);
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }

    return NextResponse.json({
      status: 201,
      qrCodeImage: qrCodeDataURL,
    });
  } catch (error) {
    console.error("Error during booking process:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
