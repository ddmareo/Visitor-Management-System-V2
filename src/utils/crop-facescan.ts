export const cropImageToAspectRatio = (
  imageDataUrl: string,
  targetAspectRatio: number // e.g., 3/4
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const sourceWidth = img.naturalWidth;
      const sourceHeight = img.naturalHeight;
      const sourceAspectRatio = sourceWidth / sourceHeight;

      const aspectRatioTolerance = 0.01;
      if (
        Math.abs(sourceAspectRatio - targetAspectRatio) <= aspectRatioTolerance
      ) {
        console.log(
          `Image already has target aspect ratio (${sourceAspectRatio.toFixed(
            3
          )} ≈ ${targetAspectRatio.toFixed(3)}), returning as-is`
        );
        resolve(imageDataUrl);
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Could not get canvas context for cropping"));
      }

      let sx = 0,
        sy = 0,
        sWidth = sourceWidth,
        sHeight = sourceHeight;
      let canvasWidth: number, canvasHeight: number;

      if (sourceAspectRatio > targetAspectRatio) {
        // Source image is wider than target: Crop the sides
        sWidth = sourceHeight * targetAspectRatio;
        sx = (sourceWidth - sWidth) / 2;
        canvasWidth = sWidth;
        canvasHeight = sourceHeight;
      } else if (sourceAspectRatio < targetAspectRatio) {
        // Source image is taller than target: Crop the top/bottom
        sHeight = sourceWidth / targetAspectRatio;
        sy = (sourceHeight - sHeight) / 2;
        canvasWidth = sourceWidth;
        canvasHeight = sHeight;
      } else {
        // Aspect ratios already match (fallback case)
        canvasWidth = sourceWidth;
        canvasHeight = sourceHeight;
      }

      canvasWidth = Math.round(canvasWidth);
      canvasHeight = Math.round(canvasHeight);
      sx = Math.round(sx);
      sy = Math.round(sy);
      sWidth = Math.round(sWidth);
      sHeight = Math.round(sHeight);

      if (
        sWidth <= 0 ||
        sHeight <= 0 ||
        canvasWidth <= 0 ||
        canvasHeight <= 0
      ) {
        console.error("Invalid crop dimensions calculated:", {
          sx,
          sy,
          sWidth,
          sHeight,
          canvasWidth,
          canvasHeight,
        });
        return reject(new Error("Invalid crop dimensions calculated"));
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      console.log(
        `Cropping: Draw image [${img.naturalWidth}x${img.naturalHeight}] SourceRect (${sx},${sy} ${sWidth}x${sHeight}) onto Canvas (${canvasWidth}x${canvasHeight})`
      );
      ctx.drawImage(
        img,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        canvasWidth,
        canvasHeight
      );

      resolve(canvas.toDataURL("image/jpeg", 1));
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for cropping"));
    };
    img.src = imageDataUrl;
  });
};

export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const dataUrlToBlob = (dataUrl: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return reject(new Error("Could not get canvas context"));
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        },
        "image/jpeg",
        1
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
};
