import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { encryptBinary } from "@/utils/encryption";
import heicConvert from "heic-convert";
import csrf from "csrf";

const prisma = new PrismaClient();

const tokens = new csrf();
const secret = process.env.CSRF_SECRET || tokens.secretSync();

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

    const idCardFile = formData.get("idCard") as File | null;
    const name = formData.get("name") as string;
    const company = formData.get("company") as string;
    const isNewCompany = formData.get("isNewCompany") as string;
    const nomorktp = formData.get("nomorktp") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string | null;
    const address = formData.get("address") as string | null;

    if (!name || !company || !nomorktp || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let encryptedImage: Buffer | null = null;

    if (idCardFile) {
      const fileArrayBuffer = await idCardFile.arrayBuffer();
      const fileBuffer = Buffer.from(fileArrayBuffer);

      let imageBuffer: Buffer;

      const fileName = idCardFile.name.toLowerCase();
      if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
        try {
          const convertedBuffer = await heicConvert({
            buffer: fileBuffer as unknown as Buffer & ArrayBufferLike,
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
        imageBuffer = fileBuffer;
      }

      const compressedImageBuffer = await sharp(imageBuffer)
        .resize({
          width: 1200,
          height: 900,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const watermarkedImage = await sharp(compressedImageBuffer)
        .metadata()
        .then(({ width, height }) => {
          if (!width || !height) {
            throw new Error("Could not determine image dimensions.");
          }

          const fontSize = Math.min(width, height) * 0.1;
          const spacing = fontSize * 2;

          const createTiledWatermarkSVG = () => {
            let svgContent = `<svg width="${width}" height="${height}">`;

            for (let x = -spacing; x < width + spacing; x += spacing * 1.5) {
              for (let y = -spacing; y < height + spacing; y += spacing * 1.5) {
                const rotationAngle = -30 + (Math.random() * 20 - 10);

                svgContent += `
              <text 
                x="${x}" 
                y="${y}" 
                font-size="${fontSize}" 
                font-weight="bold" 
                fill="black" 
                opacity="0.3" 
                text-anchor="middle" 
                alignment-baseline="middle" 
                transform="rotate(${rotationAngle} ${x} ${y})">
                UNTUK ALVA
              </text>`;
              }
            }

            svgContent += `</svg>`;
            return svgContent;
          };

          return sharp(compressedImageBuffer)
            .composite([
              {
                input: Buffer.from(createTiledWatermarkSVG()),
              },
            ])
            .toBuffer();
        });

      encryptedImage = encryptBinary(watermarkedImage);
    }

    const existingVisitor = await prisma.visitor.findUnique({
      where: { id_number: nomorktp },
    });

    if (existingVisitor) {
      return NextResponse.json(
        { error: "NIK already exists" },
        { status: 400 }
      );
    }

    let companyId: number;

    if (isNewCompany === "true") {
      const newCompany = await prisma.company.create({
        data: {
          company_name: company,
        },
      });
      companyId = newCompany.company_id;
    } else {
      companyId = parseInt(company, 10);
      if (isNaN(companyId)) {
        return NextResponse.json(
          { error: "Invalid company ID" },
          { status: 400 }
        );
      }
    }

    await prisma.visitor.create({
      data: {
        name,
        company_id: companyId,
        id_number: nomorktp,
        contact_phone: phone,
        ...(email ? { contact_email: email } : {}),
        ...(address ? { address: address } : {}),
        ...(encryptedImage ? { id_card: encryptedImage } : {}),
      },
    });

    return NextResponse.json(
      { message: "Visitor registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}

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
    const companies = await prisma.company.findMany({
      select: {
        company_id: true,
        company_name: true,
      },
      orderBy: {
        company_name: "asc",
      },
    });

    const transformedCompanies = companies.map((company) => ({
      id: company.company_id.toString(),
      name: company.company_name,
    }));

    return NextResponse.json(transformedCompanies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
