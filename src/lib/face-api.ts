import * as faceapi from "face-api.js";
import { Canvas, Image } from "canvas";
import path from "path";
import { initializeModels } from "./model-loader";

faceapi.env.monkeyPatch({
  Canvas: Canvas as unknown as typeof HTMLCanvasElement,
  Image: Image as unknown as typeof HTMLImageElement,
});

let modelsLoaded = false;

export async function loadServerModels(): Promise<boolean> {
  if (modelsLoaded) return true;

  try {
    const MODEL_PATH = path.join(process.cwd(), "public", "models");

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH),
      faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
      faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
    ]);

    modelsLoaded = true;
    console.log("Server-side face recognition models loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading server-side face recognition models:", error);
    return false;
  }
}

async function bufferToImage(buffer: Buffer): Promise<Image> {
  const img = new Image();
  img.src = buffer;
  return img;
}

export async function getFaceDescriptor(imageBuffer: Buffer): Promise<{
  success: boolean;
  descriptor?: Float32Array;
  error?: string;
}> {
  try {
    if (!modelsLoaded) {
      const loaded = await initializeModels();
      if (!loaded) {
        return {
          success: false,
          error: "Failed to load face recognition models",
        };
      }
    }

    const img = await bufferToImage(imageBuffer);

    const detections = await faceapi
      .detectAllFaces(
        img as unknown as faceapi.TNetInput,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      return { success: false, error: "No face detected in image" };
    }

    if (detections.length > 1) {
      return {
        success: false,
        error:
          "Multiple faces detected. Please ensure only one face is visible",
      };
    }

    const descriptor = detections[0].descriptor;
    return { success: true, descriptor };
  } catch (error) {
    console.error("Error getting face descriptor:", error);
    return { success: false, error: "Failed to process face image" };
  }
}

export function compareDescriptors(
  descriptor1: Float32Array,
  descriptor2: Float32Array
): {
  isMatch: boolean;
  distance: number;
  score: number;
} {
  try {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);

    const maxDistance = 1.0;
    const score = Math.max(0, 1 - distance / maxDistance);

    const threshold = 0.4; // Lower threshold = stricter matching
    const isMatch = distance <= threshold;

    return { isMatch, distance, score };
  } catch (error) {
    console.error("Error comparing face descriptors:", error);
    return { isMatch: false, distance: 1.0, score: 0 };
  }
}

export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

export function arrayToDescriptor(array: number[]): Float32Array {
  return new Float32Array(array);
}
