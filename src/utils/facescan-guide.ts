import * as faceapi from "face-api.js";

export const FACE_CENTER_RANGE_X = { min: 0.35, max: 0.65 };
export const FACE_CENTER_RANGE_Y = { min: 0.3, max: 0.7 };

export const FACE_SIZE_RANGE = {
  min: 0.25,
  max: 0.75,
  optimal_min: 0.35,
  optimal_max: 0.65,
};

export const POSITION_BUFFER = 0.05;
export const SIZE_BUFFER = 0.05;

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

  if (faceHeightRatio < FACE_SIZE_RANGE.min) {
    return {
      status: "too_far",
      distance: "far",
      faceHeightRatio,
    };
  } else if (faceHeightRatio > FACE_SIZE_RANGE.max) {
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

  const faceCenterXRatio = faceCenterX / videoWidth;
  const faceCenterYRatio = faceCenterY / videoHeight;

  const isCenteredX =
    faceCenterXRatio >= FACE_CENTER_RANGE_X.min &&
    faceCenterXRatio <= FACE_CENTER_RANGE_X.max;
  const isCenteredY =
    faceCenterYRatio >= FACE_CENTER_RANGE_Y.min &&
    faceCenterYRatio <= FACE_CENTER_RANGE_Y.max;

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
      const centerThreshold = 0.5;
      const bufferZone = POSITION_BUFFER;

      if (faceCenterXRatio < centerThreshold - bufferZone) {
        message = "Move slightly right";
      } else if (faceCenterXRatio > centerThreshold + bufferZone) {
        message = "Move slightly left";
      } else {
        message = "Please center your face";
      }
    } else if (!isCenteredY) {
      const centerThreshold = 0.5;
      const bufferZone = POSITION_BUFFER;

      if (faceCenterYRatio < centerThreshold - bufferZone) {
        message = "Move slightly down";
      } else if (faceCenterYRatio > centerThreshold + bufferZone) {
        message = "Move slightly up";
      } else {
        message = "Please center your face";
      }
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

    let colorState: GuidanceColorState;
    if (positionResult.status === "valid") {
      colorState = "green";
    } else if (positionResult.status === "off_center") {
      const detection = detections[0];
      const box = detection.detection.box;
      const faceCenterX = (box.x + box.width / 2) / videoWidth;
      const faceCenterY = (box.y + box.height / 2) / videoHeight;

      const isCloseToCenter =
        Math.abs(faceCenterX - 0.5) < 0.15 &&
        Math.abs(faceCenterY - 0.5) < 0.15;

      colorState = isCloseToCenter ? "green" : "yellow";
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
