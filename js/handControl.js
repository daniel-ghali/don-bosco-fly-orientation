import { HandLandmarker, FilesetResolver } from "https:cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const video = document.getElementById("webcam");

let handLandmarker;
let lastVideoTime = -1;
let isTracking = false;

let targetX = 0;
let targetY = 0;
let smoothX = 0;
let smoothY = 0;
let hasHand = false;


let sigTargetX = 0.5;
let sigTargetY = 0.5;
let smoothSigX = 0.5;
let smoothSigY = 0.5;
let sigSmoothingActive = false;

let pinchActive = false;
const PINCH_ON_DIST = 0.055;
const PINCH_OFF_DIST = 0.095;

async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https:cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https:storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1,
    minHandDetectionConfidence: 0.7,
    minHandPresenceConfidence: 0.7,
    minTrackingConfidence: 0.7
  });
}

window.initHandTracking = async function () {
  await createHandLandmarker();
  startCamera();
  requestAnimationFrame(smoothTracking);
};

function smoothTracking() {
  if (hasHand && typeof window.mousePos !== 'undefined') {

    smoothX += (targetX - smoothX) * 0.15;
    smoothY += (targetY - smoothY) * 0.15;
    window.mousePos = { x: smoothX, y: smoothY };
  }

  if (hasHand) {
    if (!sigSmoothingActive) {
      smoothSigX = sigTargetX;
      smoothSigY = sigTargetY;
      sigSmoothingActive = true;
    } else {
      const k = 0.26;
      smoothSigX += (sigTargetX - smoothSigX) * k;
      smoothSigY += (sigTargetY - smoothSigY) * k;
    }
    window.handGesture = {
      x: smoothSigX,
      y: smoothSigY,
      isPinching: pinchActive
    };
  }

  requestAnimationFrame(smoothTracking);
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {

      video.width = video.videoWidth;
      video.height = video.videoHeight;
      video.style.display = "block";
      video.play();
      isTracking = true;
      requestAnimationFrame(predictWebcam);
    });
  } catch (error) {
    console.error("Camera error:", error);
  }
}

async function predictWebcam() {
  if (!isTracking) return;

  if (handLandmarker && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;

    const results = handLandmarker.detectForVideo(video, performance.now());
    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      const palm = landmarks[9];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];


      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2) +
        Math.pow(thumbTip.z - indexTip.z, 2)
      );

      if (pinchActive) {
        if (distance > PINCH_OFF_DIST) pinchActive = false;
      } else {
        if (distance < PINCH_ON_DIST) pinchActive = true;
      }


      let tx = -((palm.x - 0.5) * 4);
      let ty = -((palm.y - 0.5) * 4);

      targetX = Math.max(-1, Math.min(1, tx));
      targetY = Math.max(-1, Math.min(1, ty));
      hasHand = true;


      sigTargetX = 1 - indexTip.x;
      sigTargetY = indexTip.y;

      if (!window.isHandTrackingReady) {
        window.isHandTrackingReady = true;
        const msg = document.getElementById("handStatusMsg");
        const btn = document.getElementById("startHandBtn");
        if (msg) msg.innerText = "Hand detected! Prepare for takeoff.";
        if (btn) btn.style.display = "block";
      }
    } else {
      hasHand = false;
      sigSmoothingActive = false;
      pinchActive = false;
      window.handGesture = { isPinching: false };
    }
  }

  requestAnimationFrame(predictWebcam);
}
