import * as faceapi from "face-api.js";

export const FACE_CENTER_THRESHOLD_X = 0.45;
export const FACE_CENTER_THRESHOLD_Y = 0.4;
export const FACE_SIZE_MIN_THRESHOLD = 0.4; // Face should be at least 15% of video height
export const FACE_SIZE_MAX_THRESHOLD = 0.6; // Face should be at most 45% of video height
export const FACE_SIZE_OPTIMAL_MIN = 0.4; // Optimal range start
export const FACE_SIZE_OPTIMAL_MAX = 0.5; // Optimal range end
export const DETECTION_INTERVAL = 150;
export const AUTO_CAPTURE_DELAY = 1500;

let modelLoadPromise: Promise<boolean> | null = null;
let isModelLoaded = false;

export type GuidanceColorState = "red" | "yellow" | "green" | "blue";

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

function detectFaceDistance(
  detection: faceapi.WithFaceDetection<object>,
  videoHeight: number
): {
  status: "too_far" | "too_close" | "optimal";
  distance: "far" | "close" | "optimal";
  faceHeightRatio: number;
} {
  const box = detection.detection.box;
  const faceHeightRatio = box.height / videoHeight;

  if (faceHeightRatio < FACE_SIZE_MIN_THRESHOLD) {
    return {
      status: "too_far",
      distance: "far",
      faceHeightRatio,
    };
  } else if (faceHeightRatio > FACE_SIZE_MAX_THRESHOLD) {
    return {
      status: "too_close",
      distance: "close",
      faceHeightRatio,
    };
  } else {
    return {
      status: "optimal",
      distance: "optimal",
      faceHeightRatio,
    };
  }
}

function validateFacePosition(
  detection: faceapi.WithFaceDetection<object>,
  videoWidth: number,
  videoHeight: number
): {
  isValid: boolean;
  status: "valid" | "off_center" | "too_far" | "too_close";
  message: string;
  distance: "far" | "close" | "optimal";
  faceHeightRatio: number;
} {
  const box = detection.detection.box;
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;

  // Check distance first
  const distanceResult = detectFaceDistance(detection, videoHeight);

  if (distanceResult.status !== "optimal") {
    return {
      isValid: false,
      status: distanceResult.status,
      message:
        distanceResult.status === "too_far"
          ? "Please move closer to the camera"
          : "Please move away from the camera",
      distance: distanceResult.distance,
      faceHeightRatio: distanceResult.faceHeightRatio,
    };
  }

  // Check centering
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
      distance: "optimal",
      faceHeightRatio: distanceResult.faceHeightRatio,
    };
  } else {
    let message = "Please center your face";
    if (!isCenteredX && !isCenteredY) {
      message = "Please center your face";
    } else if (!isCenteredX) {
      message =
        faceCenterX < videoWidth * 0.5
          ? "Move slightly right"
          : "Move slightly left";
    } else if (!isCenteredY) {
      message =
        faceCenterY < videoHeight * 0.5
          ? "Move slightly down"
          : "Move slightly up";
    }

    return {
      isValid: false,
      status: "off_center",
      message,
      distance: "optimal",
      faceHeightRatio: distanceResult.faceHeightRatio,
    };
  }
}

export function processGuidance(
  detections: faceapi.WithFaceDetection<object>[],
  videoWidth: number,
  videoHeight: number,
  mode: "register" | "verify"
): {
  status:
    | "no_face"
    | "multiple_faces"
    | "valid"
    | "off_center"
    | "too_far"
    | "too_close";
  message: string;
  isValid: boolean;
  colorState: GuidanceColorState;
  distance?: "far" | "close" | "optimal";
  faceHeightRatio?: number;
} {
  if (detections.length === 0) {
    return {
      status: "no_face",
      message: "No face detected. Please position your face in the frame.",
      isValid: false,
      colorState: "red",
    };
  } else if (detections.length > 1) {
    return {
      status: "multiple_faces",
      message:
        "Multiple faces detected. Please ensure only one face is visible.",
      isValid: false,
      colorState: "red",
    };
  } else {
    const positionResult = validateFacePosition(
      detections[0],
      videoWidth,
      videoHeight
    );

    // Determine color based on status
    let colorState: GuidanceColorState;
    if (positionResult.status === "valid") {
      colorState = "green";
    } else if (
      positionResult.status === "too_far" ||
      positionResult.status === "too_close"
    ) {
      colorState = "yellow";
    } else {
      colorState = "yellow";
    }

    return {
      status: positionResult.status,
      message:
        positionResult.status === "valid"
          ? mode === "register"
            ? "Capturing..."
            : "Hold still..."
          : positionResult.message,
      isValid: positionResult.isValid,
      colorState,
      distance: positionResult.distance,
      faceHeightRatio: positionResult.faceHeightRatio,
    };
  }
}
