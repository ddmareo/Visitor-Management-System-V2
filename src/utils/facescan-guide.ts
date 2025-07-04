import * as faceapi from "face-api.js";

export const FACE_CENTER_THRESHOLD_X = 0.45;
export const FACE_CENTER_THRESHOLD_Y = 0.4;
export const DETECTION_INTERVAL = 150;
export const AUTO_CAPTURE_DELAY = 3000;

let modelLoadPromise: Promise<boolean> | null = null;
let isModelLoaded = false;

export async function preloadGuideModels(): Promise<boolean> {
  if (isModelLoaded) {
    return true;
  }

  if (modelLoadPromise) {
    return modelLoadPromise;
  }

  modelLoadPromise = loadGuideModelsInternal();
  return modelLoadPromise;
}

export async function loadGuideModels(): Promise<boolean> {
  if (isModelLoaded) {
    console.log("Client-side guide models already loaded");
    return true;
  }

  if (modelLoadPromise) {
    console.log("Model loading already in progress, waiting...");
    return modelLoadPromise;
  }

  modelLoadPromise = loadGuideModelsInternal();
  return modelLoadPromise;
}

async function loadGuideModelsInternal(): Promise<boolean> {
  try {
    const MODEL_URL = "/models";

    console.log("Loading TinyFaceDetector model...");

    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
      throw new Error("TinyFaceDetector model failed to load");
    }

    isModelLoaded = true;
    console.log("Client-side guide models loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading client-side guide models:", error);
    modelLoadPromise = null;
    return false;
  }
}

export function areModelsLoaded(): boolean {
  return isModelLoaded && faceapi.nets.tinyFaceDetector.isLoaded;
}

export async function detectFace(
  videoElement: HTMLVideoElement
): Promise<faceapi.WithFaceDetection<object>[]> {
  try {
    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
      throw new Error("TinyFaceDetector model not loaded");
    }

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.5,
    });

    const detections = await faceapi.detectAllFaces(
      videoElement,
      detectorOptions
    );
    return detections.map((detection) => ({ detection }));
  } catch (error) {
    console.error("Error during client-side face detection:", error);
    return [];
  }
}

function validateFacePosition(
  detection: faceapi.WithFaceDetection<object>,
  videoWidth: number,
  videoHeight: number
): {
  isValid: boolean;
  status: "valid" | "off_center";
  message: string;
} {
  const box = detection.detection.box;
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;

  const isCenteredX =
    faceCenterX > videoWidth * FACE_CENTER_THRESHOLD_X &&
    faceCenterX < videoWidth * (1 - FACE_CENTER_THRESHOLD_X);
  const isCenteredY =
    faceCenterY > videoHeight * FACE_CENTER_THRESHOLD_Y &&
    faceCenterY < videoHeight * (1 - FACE_CENTER_THRESHOLD_Y);

  if (isCenteredX && isCenteredY) {
    return {
      isValid: true,
      status: "valid",
      message: "Face positioned correctly",
    };
  } else {
    return {
      isValid: false,
      status: "off_center",
      message: "Please center your face",
    };
  }
}

export function processGuidance(
  detections: faceapi.WithFaceDetection<object>[],
  videoWidth: number,
  videoHeight: number,
  mode: "register" | "verify"
): {
  status: "no_face" | "multiple_faces" | "valid" | "off_center";
  message: string;
  isValid: boolean;
} {
  if (detections.length === 0) {
    return {
      status: "no_face",
      message: "No face detected. Please position your face in the frame.",
      isValid: false,
    };
  } else if (detections.length > 1) {
    return {
      status: "multiple_faces",
      message:
        "Multiple faces detected. Please ensure only one face is visible.",
      isValid: false,
    };
  } else {
    const positionResult = validateFacePosition(
      detections[0],
      videoWidth,
      videoHeight
    );

    return {
      status: positionResult.status,
      message:
        positionResult.status === "valid"
          ? mode === "register"
            ? "Capturing!"
            : "Hold still..."
          : positionResult.message,
      isValid: positionResult.isValid,
    };
  }
}
