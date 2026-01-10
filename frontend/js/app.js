import { STORE_KEY, PB_KEY, STREAK_KEY, loadJSON, saveJSON, todayStr, clearAll } from "./storage.js";
import { computeQuality, mmss } from "./quality.js";
import { estimateSinglePose, pickKeypoints, ok, angle, drawDot, drawLine } from "./pose.js";
import { shareSession, showChallengeBannerFromURL, buildChallengeURL } from "./share.js";
import { $, setBadge, toggleDrawer, showModal, closeModal, escapeHTML } from "./ui.js";

/* ---------------------------
   DOM
---------------------------- */
const video = $("video");
const overlay = $("overlay");
const ctx = overlay.getContext("2d");

const repsEl = $("reps");
const chipTime = $("chipTime");
const chipQuality = $("chipQuality");
const chipStreak = $("chipStreak");

const btnMain = $("btnMain");
const btnPause = $("btnPause");
const btnEnd = $("btnEnd");

const dToday = $("dToday");
const dPB = $("dPB");
const dStreak = $("dStreak");
const dLast = $("dLast");
const dLastDetail = $("dLastDetail");
const dQuality = $("dQuality");
const btnShareLast = $("btnShareLast");
const btnChallengeLink = $("btnChallengeLink");

const shareCanvas = $("shareCanvas");
const challengeBanner = $("challenge");

/* ---------------------------
   State
---------------------------- */
let running = false;
let paused = false;
let stream = null;

const state = {
  reps: 0,
  down: false,
  lastPhase: Date.now(),
  startTs: 0,
  pauseAccumMs: 0,
  pauseStart: 0,
  minElbow: 180,
  alignSamples: [],
  repTimes: [],
  lastRepTs: 0
};

function elapsedMs(){
  const now = Date.now();
  const elapsed = (paused ? (state.pauseStart - state.startTs - state.pauseAccumMs) : (now - state.startTs - state.pauseAccumMs));
  return Math.max(0, elapsed);
}

/* ---------------------------
   Storage + dashboard
---------------------------- */
function computeStreakPreview(date){
  const st = loadJSON(STREAK_KEY, { lastDate: null, count: 0 });
  if(!st.lastDate) return 1;
  if(st.lastDate === date) return st.count;
  const last = new Date(st.lastDate + "T00:00:00");
  const today = new Date(date + "T00:00:00");
  const diffDays = Math.round((today - last) / (1000*60*60*24));
  return (diffDays === 1) ? (st.count + 1) : 1;
}

function refreshDashboard(){
  const hist = loadJSON(STORE_KEY, []);
  const pb = loadJSON(PB_KEY, { reps: 0, quality: 0 });
  const st = loadJSON(STREAK_KEY, { lastDate: null, count: 0 });

  dToday.textContent = todayStr();
  dPB.textContent = `${pb.reps ?? 0} reps`;
  dStreak.textContent = `${st.count ?? 0} days`;
  chipStreak.textContent = `Streak: ${st.count ?? 0}d`;

  if(hist.length){
    const last = hist[0];
    dLast.textContent = `${last.reps} reps • Q${last.quality.total} • ${mmss(last.elapsedMs)}`;
    dLastDetail.textContent =
      `${last.date}${last.label ? " • " + last.label : ""} • min elbow ${last.minElbow}° • avg rep ${last.avgRepMs ? (last.avgRepMs/1000).toFixed(2)+"s" : "—"}`;

    btnShareLast.disabled = false;
    btnChallengeLink.disabled = false;

    dQuality.textContent = `Quality ${last.quality.total} (Depth ${last.quality.depth}, Tempo ${last.quality.tempo}, Align ${last.quality.align}).`;
  } else {
    dLast.textContent = "—";
    dLastDetail.textContent = "No history yet.";
    btnShareLast.disabled = true;
    btnChallengeLink.disabled = true;
    dQuality.textContent = "Depth, tempo, and body line. No half-rep heroics.";
  }
}

/* ---------------------------
   Camera + workout
---------------------------- */
async function startWorkout(){
  try{
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
  } catch (e) {
    setBadge("Camera blocked (check permissions)");
    return;
  }

  video.srcObject = stream;
  await video.play();

  // Size overlay to actual video resolution
  overlay.width = video.videoWidth || 1280;
  overlay.height = video.videoHeight || 720;

  // Reset
  running = true;
  paused = false;

  state.reps = 0;
  state.down = false;
  state.lastPhase = Date.now();
  state.startTs = Date.now();
  state.pauseAccumMs = 0;
  state.pauseStart = 0;
  state.minElbow = 180;
  state.alignSamples = [];
  state.repTimes = [];
  state.lastRepTs = 0;

  repsEl.textContent = "0";
  chipTime.textContent = "00:00";
  chipQuality.textContent = "Quality: —";

  btnMain.textContent = "RUNNING";
  btnMain.disabled = true;
  btnPause.disabled = false;
  btnEnd.disabled = false;
  btnPause.textContent = "PAUSE";

  setBadge("Camera on • tracking");
  requestAnimationFrame(updateTimeChip);
  requestAnimationFrame(loop);
}

function togglePause(){
  if(!running) return;
  paused = !paused;

  if(paused){
    state.pauseStart = Date.now();
    btnPause.textContent = "RESUME";
    setBadge("Paused");
  } else {
    state.pauseAccumMs += (Date.now() - state.pauseStart);
    state.pauseStart = 0;
    btnPause.textContent = "PAUSE";
    setBadge("Camera on • tracking");
    requestAnimationFrame(loop);
  }
}

function endWorkout(){
  if(!running) return;
  running = false;
  paused = false;

  try{
    if(stream){
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }catch{}

  ctx.clearRect(0,0,overlay.width, overlay.height);

  btnMain.disabled = false;
  btnMain.textContent = "START";
  btnPause.disabled = true;
  btnEnd.disabled = true;

  const q = computeQuality(state);
  chipQuality.textContent = `Quality: ${q.total}`;
  setBadge("Ended • save it");

  openSaveModal(q);
}

function updateTimeChip(){
  if(!running) return;
  chipTime.textContent = mmss(elapsedMs());
  requestAnimationFrame(updateTimeChip);
}

/* ---------------------------
   Rep counting
---------------------------- */
async function loop(){
  if(!running || paused) return;

  const pose = await estimateSinglePose(video);
  ctx.clearRect(0,0,overlay.width, overlay.height);

  if(pose){
    const { leftShoulder: s, leftElbow: e, leftWrist: w, leftHip: h } = pickKeypoints(pose);

    if(ok(s) && ok(e) && ok(w) && ok(h)){
      const a = angle(s,e,w);
      state.minElbow = Math.min(state.minElbow, a);

      const align = Math.abs(h.y - s.y);
      state.alignSamples.push(align);
      if(state.alignSamples.length > 180) state.alignSamples.shift();

      const now = Date.now();

      // down when elbow < 85 and held at least 500ms
      if(a < 85 && !state.down && now - state.lastPhase > 500){
        state.down = true;
        state.lastPhase = now;
      }

      // count rep when elbow returns >165 with some gating
      if(a > 165 && state.down && now - state.lastPhase > 400 && align < 120){
        state.reps++;
        state.down = false;
        state.lastPhase = now;

        if(state.lastRepTs){
          state.repTimes.push(now - state.lastRepTs);
          if(state.repTimes.length > 50) state.repTimes.shift();
        }
        state.lastRepTs = now;

        repsEl.textContent = String(state.reps);

        const q = computeQuality(state);
        chipQuality.textContent = `Quality: ${q.total}`;
      }

      // draw
      drawDot(ctx, s, "#00ff00");
      drawDot(ctx, e, "#00ff00");
      drawDot(ctx, w, "#00ff00");
      drawDot(ctx, h, "#00ff00");
      drawLine(ctx, s, e, "rgba(0,255,0,.8)");
      drawLine(ctx, e, w, "rgba(0,255,0,.8)");
      drawLine(ctx, s, h, "rgba(0,255,0,.6)");
    }
  }

  requestAnimationFrame(loop);
}

/* ---------------------------
   Save + history + share
---------------------------- */
function openSaveModal(q){
  const date = todayStr();
  const previewStreak = computeStreakPreview(date);
  chipStreak.textContent = `Streak: ${previewStreak}d`;

  showModal(
    "Save workout",
    `
      <div style="margin-bottom:10px;">
        <div><span class="k">Reps</span> <span class="v">${state.reps}</span></div>
        <div><span class="k">Time</span> <span class="v">${mmss(elapsedMs())}</span></div>
        <div><span class="k">Quality</span> <span class="v">${q.total}</span></div>
      </div>
      <div class="k" style="margin-top:10px;">Label (optional)</div>
      <input id="labelInput" placeholder="e.g., morning set, post-run, etc." />
      <div class="tiny" style="margin-top:10px;">Saved locally on this device. No account needed.</div>
    `,
    `
      <button class="secondary" id="btnModalClose" type="button">Close</button>
      <button id="btnModalSave" type="button">Save</button>
      <button id="btnModalShare" type="button">Share</button>
    `
  );

  document.getElementById("btnModalClose").onclick = closeModal;
  document.getElementById("btnModalSave").onclick = () => saveWorkout(q);
  document.getElementById("btnModalShare").onclick = async () => {
    const session = buildSession(q);
    await shareSession({ canvas: shareCanvas, session });
    setBadge("Shared");
  };
}

function buildSession(q){
  const label = (document.getElementById("labelInput")?.value || "").trim();
  const date = todayStr();
  const elapsed = elapsedMs();

  const avgRepMs = state.repTimes.length ? Math.round(state.repTimes.reduce((a,b)=>a+b,0)/state.repTimes.length) : null;

  return {
    id: cryptoRandom(),
    date,
    label,
    reps: state.reps,
    elapsedMs: elapsed,
    quality: q,
    minElbow: Math.round(state.minElbow),
    avgRepMs,
    createdAt: Date.now()
  };
}

function saveWorkout(q){
  const session = buildSession(q);

  // history
  const hist = loadJSON(STORE_KEY, []);
  hist.unshift(session);
  saveJSON(STORE_KEY, hist.slice(0, 100));

  // PB
  const pb = loadJSON(PB_KEY, { reps: 0, quality: 0 });
  if(session.reps > (pb.reps ?? 0)) pb.reps = session.reps;
  if(session.quality.total > (pb.quality ?? 0)) pb.quality = session.quality.total;
  saveJSON(PB_KEY, pb);

  // streak
  const st = loadJSON(STREAK_KEY, { lastDate: null, count: 0 });
  const preview = computeStreakPreview(session.date);
  st.lastDate = session.date;
  st.count = preview;
  saveJSON(STREAK_KEY, st);

  refreshDashboard();
  closeModal();
  setBadge("Saved • open Stats");
}

function cryptoRandom(){
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function openHistory(){
  const hist = loadJSON(STORE_KEY, []);
  const rows = hist.length
    ? hist.slice(0, 30).map(s => {
        const label = s.label ? ` • ${escapeHTML(s.label)}` : "";
        return `
          <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)">
            <div><b>${s.reps}</b> reps • Q${s.quality.total} • ${mmss(s.elapsedMs)}</div>
            <div class="tiny" style="margin-top:4px;color:rgba(255,255,255,.68)">${s.date}${label}</div>
          </div>`;
      }).join("")
    : `<div class="tiny">No sessions yet. Do a set, hit END, then Save.</div>`;

  showModal(
    "History (local)",
    rows,
    `
      <button class="secondary" id="btnModalClose" type="button">Close</button>
      <button id="btnExport" type="button">Export JSON</button>
      <button id="btnReset" type="button">Reset</button>
    `
  );

  document.getElementById("btnModalClose").onclick = closeModal;
  document.getElementById("btnExport").onclick = exportJSON;
  document.getElementById("btnReset").onclick = () => {
    clearAll();
    refreshDashboard();
    closeModal();
    setBadge("Local data reset");
  };
}

function exportJSON(){
  const hist = loadJSON(STORE_KEY, []);
  const blob = new Blob([JSON.stringify(hist, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tracksimpli_history.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function shareLast(){
  const hist = loadJSON(STORE_KEY, []);
  const last = hist[0];
  if(!last) return;
  await shareSession({ canvas: shareCanvas, session: last });
  setBadge("Shared");
}

async function copyChallengeLink(){
  const hist = loadJSON(STORE_KEY, []);
  const last = hist[0];
  if(!last) return;
  const link = buildChallengeURL(last);
  try{
    await navigator.clipboard.writeText(link);
    setBadge("Challenge link copied");
  } catch {
    setBadge("Couldn’t copy link");
  }
}

/* ---------------------------
   Wire UI
---------------------------- */
$("menuBtn").onclick = toggleDrawer;
$("btnHistory").onclick = openHistory;
$("btnResetLocal").onclick = () => { clearAll(); refreshDashboard(); setBadge("Local data reset"); };

btnMain.onclick = startWorkout;
btnPause.onclick = togglePause;
btnEnd.onclick = endWorkout;

btnShareLast.onclick = shareLast;
btnChallengeLink.onclick = copyChallengeLink;

$("modalWrap").addEventListener("click", (e) => {
  if(e.target === $("modalWrap")) closeModal();
});

/* ---------------------------
   Boot
---------------------------- */
refreshDashboard();
showChallengeBannerFromURL(challengeBanner);
setBadge("Ready • tap START");
