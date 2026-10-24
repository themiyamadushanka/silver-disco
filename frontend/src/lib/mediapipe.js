/**
 * Loader utility for Google MediaPipe Hands & Camera Utils
 * Loads scripts via CDN dynamically to avoid Turbopack/Next.js WASM worker packaging issues.
 */

let scriptsLoadedPromise = null;

export function loadMediaPipeScripts() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("MediaPipe can only run in the browser."));
  }

  if (window.Hands && window.Camera) {
    return Promise.resolve();
  }

  if (scriptsLoadedPromise) {
    return scriptsLoadedPromise;
  }

  scriptsLoadedPromise = new Promise((resolve, reject) => {
    const loadScript = (src) => {
      return new Promise((res, rej) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          res();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.crossOrigin = "anonymous";
        script.onload = () => res();
        script.onerror = (err) => rej(err);
        document.head.appendChild(script);
      });
    };

    // Load Camera utils first, then Hands
    loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js")
      .then(() => loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"))
      .then(() => {
        if (window.Hands) {
          resolve();
        } else {
          reject(new Error("MediaPipe Hands failed to attach to window."));
        }
      })
      .catch((err) => {
        scriptsLoadedPromise = null;
        reject(err);
      });
  });

  return scriptsLoadedPromise;
}

/**
 * Standard MediaPipe Hand Landmark Connections
 */
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm Base knuckles
  [5, 9], [9, 13], [13, 17]
];
