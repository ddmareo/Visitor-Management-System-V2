import { loadServerModels } from "@/lib/face-api";

let modelsLoadedPromise: Promise<boolean> | null = null;

/**
 * Initializes the face-api models only once.
 * On the first call, it loads the models and stores the promise.
 * On subsequent calls, it returns the already-existing promise.
 * This prevents re-loading the models on every API request.
 *
 * @returns {Promise<boolean>} A promise that resolves to true if models are loaded.
 */
export const initializeModels = (): Promise<boolean> => {
  if (!modelsLoadedPromise) {
    console.log("Initializing face-api models for the first time...");
    modelsLoadedPromise = loadServerModels()
      .then((loaded) => {
        if (loaded) {
          console.log("face-api.js models loaded successfully.");
        } else {
          console.error("Failed to load face-api.js models.");
          modelsLoadedPromise = null;
        }
        return loaded;
      })
      .catch((error) => {
        console.error("Error initializing face-api models:", error);
        modelsLoadedPromise = null;
        throw error;
      });
  } else {
    console.log(
      "Face-api models are already loaded or being loaded. Reusing instance."
    );
  }

  return modelsLoadedPromise;
};
