// frontend/js/app.js

import { initHUD, updateHUD } from "./ui/hud.js";
import { initDrawer } from "./ui/drawer.js";
import { showSaveModal, closeModal } from "./ui/modal.js";

// --------------------
// Global workout state
// --------------------
export const state = {
  running: false,
  paused: false,
  reps: 0,

  startTs: 0,
  pauseStart: 0,
  pauseAccumMs: 0
};

// --------------------
// Entry point
// --------------------
window.addEventListener("DOMContentLoaded", () => {
  initHUD({
    onStart: startWorkout,
    onPause: togglePause,
    onEnd: endWorkout
  });

  initDrawer();
});

// --------------------
// Workout controls
// --------------------
async function startWorkout() {
  if (state.running) return;

  state.running = true;
  state.paused = false;
  state.reps = 0;
  state.startTs = Date.now();
  state.pauseAccumMs = 0;

  await startCamera();
  requestAnimationFrame(loop);
}

function togglePause() {
  if (!state.running) return;

  state.paused = !state.paused;

  if (state.paused) {
    state.pauseStart = Date.now();
  } else {
    state.pauseAccumMs += Date.now() - state.pauseStart;
  }
}

function endWorkout() {
  if (!state.running) return;

  state.running = false;
  stopCamera();

  showSaveModal({
    reps: state.reps,
    time: getElapsedTime(),
    quality: { total: 0 }, // placeholder until scoring module
    onSave: saveWorkout,
    onClose: closeModal
  });
}

// --------------------
// Core loop
// --------------------
function loop() {
  if (!state.running || state.paused) return;

  // This is where pose detection + rep counting goes later
  // For now, fake reps so UI proves it works
  state.reps += Math.random() < 0.01 ? 1 : 0;

  updateHUD(state, null);

  requestAnimationFrame(loop);
}

// --------------------
// Helpers
// --------------------
function getElapsedTime() {
  const now = Date.now();
  const elapsed =
    (state.paused ? state.pauseStart : now) -
    state.startTs -
    state.pauseAccumMs;

  return elapsed;
}

// --------------------
// Camera (minimal)
// --------------------
let stream = null;

async function startCamera() {
  const video = document.getElementById("video");
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false
  });
  video.srcObject = stream;
  await video.play();
}

function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach(t => t.stop());
  stream = null;
}
