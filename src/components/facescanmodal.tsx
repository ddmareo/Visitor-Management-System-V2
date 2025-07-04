import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, RotateCcw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import CameraObject, { CameraRef } from "./camera";
import {
  loadGuideModels,
  areModelsLoaded,
  detectFace,
  processGuidance,
  AUTO_CAPTURE_DELAY,
  DETECTION_INTERVAL,
  FACE_CENTER_THRESHOLD_X,
  FACE_CENTER_THRESHOLD_Y,
  GuidanceColorState,
} from "@/utils/facescan-guide";
import {
  cropImageToAspectRatio,
  blobToDataUrl,
  dataUrlToBlob,
} from "@/utils/crop-facescan";

type ModalState =
  | "loading_models" // Initial state, loading tiny model (only if not cached)
  | "initializing_camera"
  | "guiding"
  | "capturing"
  | "processing_image"
  | "submitting"
  | "success"
  | "error";

type ScanMode = "register" | "verify";

interface BaseProps {
  onClose: () => void;
  mode: ScanMode;
}

interface RegisterProps extends BaseProps {
  mode: "register";
  onRegisterConfirm: (imageBlob: Blob) => void; // Pass the blob to parent
  visitorId?: never;
  faceDescriptor?: never;
  onVerificationComplete?: never;
}

interface VerifyProps extends BaseProps {
  mode: "verify";
  visitId?: string;
  faceDescriptor?: number[];
  onVerificationComplete: (success: boolean, name?: string) => void;
}

export type FaceScanModalProps = RegisterProps | VerifyProps;

export default function FaceScanModal(props: FaceScanModalProps) {
  const { onClose, mode } = props;

  // State machine
  const [modalState, setModalState] = useState<ModalState>("loading_models");
  const [guidanceMessage, setGuidanceMessage] = useState("Loading models...");
  const [guidanceColorState, setGuidanceColorState] =
    useState<GuidanceColorState>("blue");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelScore, setModelScore] = useState<number | null>(null);

  // Camera state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const cameraRef = useRef<CameraRef>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Detection loop references
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDetectingRef = useRef(false);
  const validStartTimeRef = useRef<number | null>(null);

  const startDetectionLoop = useCallback(
    (videoElement: HTMLVideoElement) => {
      if (detectionIntervalRef.current)
        clearInterval(detectionIntervalRef.current);
      isDetectingRef.current = false;
      validStartTimeRef.current = null;

      detectionIntervalRef.current = setInterval(async () => {
        if (
          !videoElement ||
          videoElement.paused ||
          videoElement.ended ||
          isDetectingRef.current ||
          modalState !== "guiding"
        ) {
          return;
        }

        if (videoElement.readyState < videoElement.HAVE_CURRENT_DATA) return;

        isDetectingRef.current = true;

        try {
          const detections = await detectFace(videoElement);
          const videoWidth = videoElement.videoWidth;
          const videoHeight = videoElement.videoHeight;

          const guidanceResult = processGuidance(
            detections,
            videoWidth,
            videoHeight,
            mode
          );

          // Update guidance message
          setGuidanceMessage(guidanceResult.message);
          setGuidanceColorState(guidanceResult.colorState);

          // Auto-capture logic
          if (guidanceResult.status === "valid") {
            if (validStartTimeRef.current === null) {
              validStartTimeRef.current = Date.now();
            } else {
              if (
                Date.now() - validStartTimeRef.current >=
                AUTO_CAPTURE_DELAY
              ) {
                console.log("Auto-capture threshold met.");
                validStartTimeRef.current = null;
                setModalState("capturing");
                cameraRef.current?.captureImage();
              }
            }
          } else {
            validStartTimeRef.current = null;
          }
        } catch (error) {
          console.error("Error during face detection loop:", error);
          setGuidanceMessage("Detection error occurred.");
          validStartTimeRef.current = null;
        } finally {
          isDetectingRef.current = false;
        }
      }, DETECTION_INTERVAL);
    },
    [mode, modalState]
  );

  useEffect(() => {
    async function initializeGuideModels() {
      // Check if models are already loaded
      if (areModelsLoaded()) {
        console.log("Models already cached, skipping to camera initialization");
        setGuidanceMessage("Initializing camera...");
        setModalState("initializing_camera");
        return;
      }

      setModalState("loading_models");
      setGuidanceMessage("Loading face detection models...");

      try {
        const loaded = await loadGuideModels();
        if (loaded) {
          setGuidanceMessage("Models loaded. Initializing camera...");
          setModalState("initializing_camera");
        } else {
          setModalState("error");
          setErrorMessage("Failed to load face detection models.");
        }
      } catch (error) {
        console.error("Error loading guide models:", error);
        setModalState("error");
        setErrorMessage("Error loading face detection models.");
      }
    }

    initializeGuideModels();
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    const cleanupDetection = () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      isDetectingRef.current = false;
      validStartTimeRef.current = null;
    };

    if (
      modalState === "guiding" &&
      stream &&
      cameraRef.current?.videoElement &&
      !cameraError
    ) {
      const videoElement = cameraRef.current.videoElement;

      const checkVideoAndStart = () => {
        if (videoElement.readyState >= videoElement.HAVE_METADATA) {
          startDetectionLoop(videoElement);
        } else {
          videoElement.addEventListener(
            "loadedmetadata",
            () => startDetectionLoop(videoElement),
            { once: true }
          );
        }
      };

      checkVideoAndStart();
    } else {
      cleanupDetection();
    }

    return cleanupDetection;
  }, [modalState, stream, cameraError, startDetectionLoop]);

  const handleStreamReady = useCallback((mediaStream: MediaStream) => {
    setStream(mediaStream);
    setCameraError(null);
    setModalState("guiding");
    setGuidanceMessage("Position your face in the frame...");
  }, []);

  const handleCapture = useCallback(
    async (imageBlob: Blob) => {
      if (mode === "register") {
        await processImageForRegistration(imageBlob);
      } else {
        setModalState("submitting");
        await submitForVerification(imageBlob);
      }
    },
    [mode, props]
  );

  const processImageForRegistration = async (imageBlob: Blob) => {
    try {
      setModalState("processing_image");
      setGuidanceMessage("Processing image...");

      const dataUrl = await blobToDataUrl(imageBlob);

      const croppedDataUrl = await cropImageToAspectRatio(dataUrl, 3 / 4);

      const croppedBlob = await dataUrlToBlob(croppedDataUrl);

      setModalState("submitting");
      await submitForRegistration(croppedBlob);
    } catch (error) {
      console.error("Error processing image for registration:", error);
      setModalState("error");
      setErrorMessage("Error processing captured image");
    }
  };

  const submitForRegistration = async (imageBlob: Blob) => {
    try {
      const registerProps = props as RegisterProps;
      setModalState("success");
      setGuidanceMessage("Image captured successfully!");

      registerProps.onRegisterConfirm(imageBlob);

      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("Registration error:", error);
      setModalState("error");
      setErrorMessage("Error processing captured image");
    }
  };

  const submitForVerification = async (imageBlob: Blob) => {
    try {
      const verifyProps = props as VerifyProps;
      const formData = new FormData();
      formData.append("faceScan", imageBlob, "face.jpg");
      formData.append(
        "faceDescriptor",
        JSON.stringify(verifyProps.faceDescriptor)
      );

      const response = await fetch(
        `/api/visits/verify/${verifyProps.visitId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        setModalState("success");
        setGuidanceMessage("Verification successful!");
        setTimeout(() => onClose(), 2000);
        verifyProps.onVerificationComplete(true);
      } else {
        setModalState("error");
        setErrorMessage(result.error || "Verification failed");
        setModelScore(result.score);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setModalState("error");
      setErrorMessage("Network error during verification");
    }
  };

  const handleRetry = () => {
    setModalState("guiding");
    setErrorMessage(null);
    setGuidanceMessage("Position your face in the frame...");
  };

  const handleClose = () => {
    if (mode === "verify" && modalState === "error") {
      const verifyProps = props as VerifyProps;
      verifyProps.onVerificationComplete(false);
    }
    onClose();
  };

  const renderContent = () => {
    switch (modalState) {
      case "loading_models":
        return (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
              <p className="text-white">{guidanceMessage}</p>
            </div>
          </div>
        );

      case "initializing_camera":
      case "guiding":
      case "capturing":
        return (
          <div className="relative w-full h-full">
            <CameraObject
              ref={cameraRef}
              onCapture={handleCapture}
              onStreamReady={handleStreamReady}
            />

            {modalState === "initializing_camera" && (
              <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-30">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
                  <p className="text-white">Initializing camera...</p>
                </div>
              </div>
            )}

            {modalState !== "initializing_camera" && (
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`border-2 border-y dashed rounded-full transition-all duration-300 ${
                      guidanceColorState === "red"
                        ? "border-red-500/70 animate-pulse"
                        : guidanceColorState === "yellow"
                        ? "border-yellow-500/70 animate-pulse"
                        : guidanceColorState === "green"
                        ? "border-green-500/70"
                        : "border-blue-500/50 animate-pulse"
                    }`}
                    style={{
                      width: `${(1 - 2 * FACE_CENTER_THRESHOLD_X) * 100 + 40}%`,
                      height: `${
                        (1 - 2 * FACE_CENTER_THRESHOLD_Y) * 100 + 40
                      }%`,
                      maxWidth: "85%",
                      maxHeight: "85%",
                    }}
                  />
                </div>

                <div className="absolute bottom-10 left-0 right-0 text-center p-2">
                  <p className="text-sm bg-black/40 px-2 py-1 rounded backdrop-blur-sm inline-block text-white">
                    {guidanceMessage}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "processing_image":
      case "submitting":
        return (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
              <p className="text-white">
                {modalState === "processing_image"
                  ? "Processing image..."
                  : mode === "register"
                  ? "Finalizing registration..."
                  : "Verifying..."}
              </p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="flex items-center justify-center h-full bg-green-600/90">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-white mx-auto mb-2" />
              <p className="text-white text-xl font-semibold">
                {guidanceMessage}
              </p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex items-center justify-center h-full bg-red-600/90">
            <div className="text-center p-4">
              <XCircle className="h-16 w-16 text-white mx-auto mb-2" />
              <span className="text-white flex flex-col gap-2 items-center">
                <p>
                  Score:{" "}
                  {modelScore != null
                    ? (modelScore * 100).toFixed(2) + "%"
                    : "N/A"}
                </p>
                <p className="text-white font-semibold mb-4">
                  {errorMessage || "An error occurred"}
                </p>
              </span>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition-colors mr-2">
                <RotateCcw className="inline-block h-4 w-4 mr-1" />
                Retry
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-transparent p-4 w-full h-full max-w-xl mx-4">
        <div className="relative w-full h-full max-h-full flex items-center justify-center">
          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden relative shadow-lg w-full h-auto max-h-[95vh] max-w-md md:max-h-[90vh] md:w-auto md:h-[90vh]">
            {renderContent()}

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition-colors z-50"
              aria-label="Close">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
