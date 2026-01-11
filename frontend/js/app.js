// frontend/js/app.js

let detector;
let running = false;
let reps = 0;
let down = false;
let lastPhase = Date.now();

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const repsBox = document.getElementById("reps");
const btn = document.getElementById("btn");

// ----------------------------
// Utils
// ----------------------------
function angle(a, b, c) {
  const ab = [a.x - b.x, a.y - b.y];
  const cb = [c.x - b.x, c.y - b.y];
  const dot = ab[0] * cb[0] + ab[1] * cb[1];
  const mag = Math.hypot(...ab) * Math.hypot(...cb);
  return mag ? Math.acos(dot / mag) * 180 / Math.PI : 180;
}

// ----------------------------
// Start / Stop
// ----------------------------
btn.onclick = async () => {
  if (!running) {
    await start();
    btn.textContent = "STOP";
  } else {
    stop();
    btn.textContent = "START";
  }
};

async function start() {
  running = true;
  reps = 0;
  down = false;
  repsBox.textContent = "0";

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false
  });

  video.srcObject = stream;
  await video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  );

  requestAnimationFrame(loop);
}

function stop() {
  running = false;
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ----------------------------
// Loop
// ----------------------------
async function loop() {
  if (!running) return;

  const poses = await detector.estimatePoses(video);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (poses[0]) {
    const lm = poses[0].keypoints;
    const s = lm[5];  // shoulder
    const e = lm[7];  // elbow
    const w = lm[9];  // wrist
    const h = lm[11]; // hip

    if (s.score > 0.3 && e.score > 0.3 && w.score > 0.3) {
      const a = angle(s, e, w);
      const align = Math.abs(h.y - s.y);
      const now = Date.now();

      if (a < 85 && !down && now - lastPhase > 500) {
        down = true;
        lastPhase = now;
      }

      if (a > 165 && down && now - lastPhase > 400 && align < 120) {
        reps++;
        down = false;
        lastPhase = now;
        repsBox.textContent = reps;
      }

      draw(s); draw(e); draw(w);
      line(s, e); line(e, w); line(s, h);
    }
  }

  requestAnimationFrame(loop);
}

// ----------------------------
// Draw helpers
// ----------------------------
function draw(p) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#00ff00";
  ctx.fill();
}

function line(a, b) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = "rgba(0,255,0,.7)";
  ctx.lineWidth = 3;
  ctx.stroke();
}
