import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  getFaceDescriptor,
  compareDescriptors,
  arrayToDescriptor,
} from "@/lib/face-api";
import { initializeModels } from "@/lib/model-loader";

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const userWithSecurity = await prisma.users.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        security: true,
      },
    });

    if (session.user.role !== "security" || !userWithSecurity?.security) {
      return NextResponse.json(
        { error: "Access denied: Security role required" },
        { status: 403 }
      );
    }

    if (!userWithSecurity?.security) {
      return NextResponse.json(
        { error: "Security information not found" },
        { status: 404 }
      );
    }

    const visitId = parseInt(params.id, 10);

    const contentType = request.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const faceScanFile = formData.get("faceScan") as File;
      const faceDescriptorJson = formData.get("faceDescriptor") as string;

      if (!faceScanFile) {
        return NextResponse.json(
          { error: "Face scan image is required" },
          { status: 400 }
        );
      }

      if (!faceDescriptorJson) {
        return NextResponse.json(
          { error: "Reference face descriptor is required" },
          { status: 400 }
        );
      }

      let referenceFaceDescriptor: number[];
      try {
        referenceFaceDescriptor = JSON.parse(faceDescriptorJson);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid face descriptor format" },
          { status: 400 }
        );
      }

      const arrayBuffer = await faceScanFile.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      const modelsLoaded = await initializeModels();
      if (!modelsLoaded) {
        return NextResponse.json(
          { error: "Failed to load face recognition models" },
          { status: 500 }
        );
      }

      const faceResult = await getFaceDescriptor(imageBuffer);
      if (!faceResult.success) {
        return NextResponse.json(
          { error: faceResult.error || "Failed to process face image" },
          { status: 400 }
        );
      }

      const referenceDescriptor = arrayToDescriptor(referenceFaceDescriptor);
      const comparisonResult = compareDescriptors(
        referenceDescriptor,
        faceResult.descriptor!
      );

      if (!comparisonResult.isMatch) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Face verification failed. Please try again or contact admin.",
            score: comparisonResult.score,
          },
          { status: 400 }
        );
      }

      // Face verification successful - update visit status
      const updatedVisit = await prisma.visit.update({
        where: {
          visit_id: visitId,
        },
        data: {
          verification_status: true,
          security: {
            connect: {
              security_id: userWithSecurity.security.security_id,
            },
          },
        },
        include: {
          visitor: true,
          employee: true,
          security: true,
          teammember: true,
        },
      });

      return NextResponse.json({
        success: true,
        user_name: updatedVisit.visitor?.name,
        verification_score: comparisonResult.score,
      });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to update verification status" },
      { status: 500 }
    );
  }
}
