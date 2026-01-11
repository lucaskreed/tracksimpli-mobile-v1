// js/ui/drawer.js

export function initDrawer() {
  document.getElementById("menuBtn").onclick = toggleDrawer;
}

export function updateDrawer({ history, pb, streak }) {
  document.getElementById("dPB").textContent = `${pb.reps} reps`;
  document.getElementById("dStreak").textContent = `${streak} days`;

  if (!history.length) return;

  const last = history[0];
  document.getElementById("dLast").textContent =
    `${last.reps} reps • Q${last.quality.total}`;
}

function toggleDrawer() {
  document.getElementById("drawer").classList.toggle("open");
}
