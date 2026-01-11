// js/ui/hud.js

export function initHUD({ onStart, onPause, onEnd }) {
  document.getElementById("btnMain").onclick = onStart;
  document.getElementById("btnPause").onclick = onPause;
  document.getElementById("btnEnd").onclick = onEnd;
}

export function updateHUD(state, quality) {
  document.getElementById("reps").textContent = state.reps;
  document.getElementById("chipTime").textContent = formatTime(state);
  document.getElementById("chipQuality").textContent =
    quality ? `Quality: ${quality.total}` : "Quality: —";
}

function formatTime(state) {
  const now = Date.now();
  const elapsed =
    (state.paused
      ? state.pauseStart
      : now) - state.startTs - state.pauseAccumMs;

  const s = Math.max(0, Math.floor(elapsed / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
