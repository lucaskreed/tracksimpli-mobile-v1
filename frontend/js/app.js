import { TESTS, getTest } from "./tests/index.js";
import {
  loadSessions, addSession, clearSessions,
  getPB, getStreak, getTodayCount,
  exportSessionsJSON, getSettings, setSettings,
  buildChallengeURL, getChallengeFromURL
} from "./storage/sessions.js";
import { formatDateShort, formatDuration, todayKey } from "./utils/time.js";
import { WorkoutController } from "./capture/loop.js";

document.addEventListener("DOMContentLoaded", () => boot());

function boot(){
  wireNavActive();
  const page = document.body?.dataset?.page || "";

  if(page === "dashboard") initDashboard();
  if(page === "history") initHistory();
  if(page === "progress") initProgress();
  if(page === "settings") initSettings();
  if(page === "test") initTest();
}

/* ----------------------- Toast ----------------------- */
function toast(title, message = "", icon = "✅", ms = 2200){
  const host = document.getElementById("toastHost");
  if(!host) return;

  host.innerHTML = "";
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `
    <div class="t-ico">${icon}</div>
    <div>
      <b>${escapeHTML(title)}</b>
      ${message ? `<p>${escapeHTML(message)}</p>` : ``}
    </div>
  `;
  host.appendChild(el);
  setTimeout(() => { try{ host.innerHTML = ""; }catch{} }, ms);
}

/* ----------------------- Nav ----------------------- */
function wireNavActive(){
  const path = (location.pathname || "").toLowerCase();
  const items = document.querySelectorAll(".nav-item");
  if(!items.length) return;

  let key = "dashboard";
  if(path.includes("/screens/test")) key = "test";
  else if(path.includes("/screens/progress")) key = "progress";
  else if(path.includes("/screens/history")) key = "history";
  else if(path.includes("/screens/settings")) key = "settings";
  else key = "dashboard";

  items.forEach(a => a.classList.toggle("active", a.dataset.nav === key));
}

/* ----------------------- Dashboard ----------------------- */
function initDashboard(){
  const todayCountEl = document.getElementById("todayCount");
  const streakEl = document.getElementById("streakCount");
  const pbEl = document.getElementById("pbCount");
  const feedEl = document.getElementById("feedList");
  const emptyEl = document.getElementById("feedEmpty");

  const sessions = loadSessions();
  if(todayCountEl) todayCountEl.textContent = String(getTodayCount());
  if(streakEl) streakEl.textContent = String(getStreak());

  const pb = getPB(null);
  if(pbEl){
    pbEl.textContent = pb ? `${pb.count}` : "—";
  }

  const challenge = getChallengeFromURL();
  if(challenge){
    toast(
      "Challenge received",
      `Beat ${challenge.count} in ${challenge.testId}${challenge.quality ? ` (Q${challenge.quality})` : ""}`,
      "🔥",
      3800
    );
  }

  if(!feedEl) return;

  feedEl.innerHTML = "";
  const show = sessions.slice(0, 12);

  if(!show.length){
    if(emptyEl) emptyEl.hidden = false;
    return;
  }
  if(emptyEl) emptyEl.hidden = true;

  for(const s of show){
    feedEl.appendChild(renderFeedItem(s));
  }
}

function renderFeedItem(s){
  const el = document.createElement("div");
  el.className = "feed-item";

  const q = typeof s.quality === "object" ? s.quality?.total : s.quality;
  const qTxt = (q || q === 0) ? `Q${q}` : "Q—";

  el.innerHTML = `
    <div class="feed-top">
      <div>
        <div class="feed-title">${escapeHTML(s.testName || s.testId)}</div>
        <div class="feed-sub">${escapeHTML(formatDateShort(s.createdAt))} • ${escapeHTML(formatDuration(s.durationMs || 0))}</div>
      </div>
      <button class="btn ghost" type="button" data-action="share">Share</button>
    </div>
    <div class="feed-metrics">
      <span class="pill"><strong>${escapeHTML(String(s.count))}</strong> ${escapeHTML(metricLabel(s.testId))}</span>
      <span class="pill"><strong>${escapeHTML(qTxt)}</strong></span>
      ${s.notes ? `<span class="pill">“${escapeHTML(s.notes)}”</span>` : ``}
    </div>
  `;

  el.querySelector('[data-action="share"]')?.addEventListener("click", async () => {
    const link = buildChallengeURL(s);
    const text = `TrackSimpli ${s.testName}: ${s.count} ${metricLabel(s.testId)} • ${qTxt} • ${formatDuration(s.durationMs)}\nChallenge: ${link}`;
    try{
      if(navigator.share){
        await navigator.share({ title:"TrackSimpli", text, url: link });
        toast("Shared", "Nice. Social validation achieved.", "📣");
      }else{
        await navigator.clipboard.writeText(link);
        toast("Link copied", "Paste it somewhere dramatic.", "🔗");
      }
    }catch{
      try{
        await navigator.clipboard.writeText(link);
        toast("Link copied", "Sharing failed, clipboard wins.", "🔗");
      }catch{
        toast("Share failed", "Your browser chose violence.", "⚠️", 3200);
      }
    }
  });

  return el;
}

/* ----------------------- History ----------------------- */
function initHistory(){
  const listEl = document.getElementById("historyList");
  const filterEl = document.getElementById("historyFilter");
  const exportBtn = document.getElementById("btnExport");
  const clearBtn = document.getElementById("btnClear");

  if(filterEl){
    filterEl.innerHTML = `<option value="">All tests</option>` + TESTS.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  }

  const render = () => {
    const sessions = loadSessions();
    const filter = filterEl?.value || "";
    const filtered = filter ? sessions.filter(s => s.testId === filter) : sessions;

    if(!listEl) return;
    listEl.innerHTML = "";

    if(!filtered.length){
      listEl.innerHTML = `<div class="empty">Nothing here yet. Progress requires effort. Annoying, I know.</div>`;
      return;
    }

    for(const s of filtered){
      listEl.appendChild(renderHistoryRow(s));
    }
  };

  filterEl?.addEventListener("change", render);
  exportBtn?.addEventListener("click", () => downloadText("tracksimpli_sessions.json", exportSessionsJSON(), "application/json"));
  clearBtn?.addEventListener("click", () => {
    clearSessions();
    toast("Cleared", "Local history deleted.", "🧼");
    render();
  });

  render();
}

function renderHistoryRow(s){
  const el = document.createElement("div");
  el.className = "feed-item";

  const q = typeof s.quality === "object" ? s.quality?.total : s.quality;
  const qTxt = (q || q === 0) ? `Q${q}` : "Q—";

  el.innerHTML = `
    <div class="feed-top">
      <div>
        <div class="feed-title">${escapeHTML(s.testName || s.testId)} • ${escapeHTML(String(s.count))} ${escapeHTML(metricLabel(s.testId))}</div>
        <div class="feed-sub">${escapeHTML(formatDateShort(s.createdAt))} • ${escapeHTML(formatDuration(s.durationMs || 0))} • ${escapeHTML(qTxt)}</div>
      </div>
      <button class="btn ghost" type="button" data-action="copy">Copy link</button>
    </div>
    ${s.notes ? `<div class="muted" style="font-size:12px;margin-top:6px;">${escapeHTML(s.notes)}</div>` : ``}
  `;

  el.querySelector('[data-action="copy"]')?.addEventListener("click", async () => {
    const link = buildChallengeURL(s);
    try{
      await navigator.clipboard.writeText(link);
      toast("Copied", "Challenge link copied.", "🔗");
    }catch{
      toast("Failed", "Clipboard permission said no.", "⚠️", 3000);
    }
  });

  return el;
}

/* ----------------------- Progress ----------------------- */
function initProgress(){
  const canvas = document.getElementById("progressChart");
  const select = document.getElementById("progressTest");
  const label = document.getElementById("progressLabel");

  if(select){
    const settings = getSettings();
    select.innerHTML = TESTS.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    select.value = settings.defaultTestId || "pushup";
  }

  const render = () => {
    if(!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const w = canvas.clientWidth || 680;
    const h = canvas.clientHeight || 240;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr,dpr);

    const testId = select?.value || "pushup";
    const sessions = loadSessions().filter(s => s.testId === testId).slice().reverse();

    if(label){
      label.textContent = sessions.length ? `${sessions.length} sessions • ${metricLabel(testId)}` : `No sessions for ${testId}`;
    }

    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "rgba(255,255,255,.06)";
    roundRect(ctx, 0, 0, w, h, 18);
    ctx.fill();

    if(!sessions.length){
      ctx.fillStyle = "rgba(255,255,255,.70)";
      ctx.font = "900 14px system-ui";
      ctx.fillText("Do a test to see progress here.", 18, 38);
      return;
    }

    const values = sessions.map(s => s.count);
    const maxV = Math.max(...values, 1);
    const pad = 18;
    const innerW = w - pad*2;
    const innerH = h - pad*2 - 18;

    // axis line
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad + innerH);
    ctx.lineTo(pad + innerW, pad + innerH);
    ctx.stroke();

    const n = values.length;
    const barW = Math.max(6, Math.min(22, innerW / Math.max(n, 1) - 6));
    const gap = (innerW - barW*n) / Math.max(n-1, 1);

    // bars (no fancy colors, just readable)
    ctx.fillStyle = "rgba(42,60,255,.55)";
    values.forEach((v, i) => {
      const x = pad + i*(barW + gap);
      const bh = Math.max(3, (v / maxV) * innerH);
      const y = pad + innerH - bh;
      roundRect(ctx, x, y, barW, bh, 8);
      ctx.fill();
    });

    const best = getPB(testId);
    ctx.fillStyle = "rgba(255,255,255,.86)";
    ctx.font = "900 13px system-ui";
    ctx.fillText(`Best: ${best?.count ?? 0}`, pad, pad + 14);
  };

  select?.addEventListener("change", () => {
    setSettings({ defaultTestId: select.value });
    render();
  });

  window.addEventListener("resize", render);
  render();
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

/* ----------------------- Settings ----------------------- */
function initSettings(){
  const mirrorToggle = document.getElementById("mirrorToggle");
  const exportBtn = document.getElementById("btnExport");
  const clearBtn = document.getElementById("btnClear");
  const versionEl = document.getElementById("appVersion");
  const storageEl = document.getElementById("storageInfo");

  const settings = getSettings();
  if(mirrorToggle) mirrorToggle.checked = settings.mirrorFrontCamera;

  mirrorToggle?.addEventListener("change", () => {
    setSettings({ mirrorFrontCamera: Boolean(mirrorToggle.checked) });
    toast("Saved", "Camera setting updated.", "⚙️");
  });

  exportBtn?.addEventListener("click", () => downloadText("tracksimpli_sessions.json", exportSessionsJSON(), "application/json"));

  clearBtn?.addEventListener("click", () => {
    clearSessions();
    toast("Cleared", "Local data wiped.", "🧼");
    refreshStorageInfo();
  });

  if(versionEl) versionEl.textContent = "v1.0 (static)";
  refreshStorageInfo();

  function refreshStorageInfo(){
    if(!storageEl) return;
    const count = loadSessions().length;
    const approx = new Blob([exportSessionsJSON()]).size;
    storageEl.textContent = `${count} sessions • ~${Math.round(approx/1024)} KB`;
  }
}

/* ----------------------- Test Page ----------------------- */
function initTest(){
  const video = document.getElementById("video");
  const canvas = document.getElementById("overlay");
  const badge = document.getElementById("badge");
  const title = document.getElementById("testTitle");

  const countEl = document.getElementById("count");
  const chipTime = document.getElementById("chipTime");
  const chipQuality = document.getElementById("chipQuality");

  const sel = document.getElementById("testSelect");
  const btnStart = document.getElementById("btnStart");
  const btnPause = document.getElementById("btnPause");
  const btnEnd = document.getElementById("btnEnd");
  const btnStats = document.getElementById("btnStats");

  const drawer = document.getElementById("drawer");
  const dToday = document.getElementById("dToday");
  const dPB = document.getElementById("dPB");
  const dStreak = document.getElementById("dStreak");
  const dLast = document.getElementById("dLast");

  const modalWrap = document.getElementById("modalWrap");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");
  const modalSave = document.getElementById("modalSave");

  if(!video || !canvas) return;

  const settings = getSettings();
  const controller = new WorkoutController({ videoEl: video, canvasEl: canvas, mirror: settings.mirrorFrontCamera });

  if(settings.mirrorFrontCamera){
    video.classList.add("mirror");
    canvas.classList.add("mirror");
  }

  if(sel){
    sel.innerHTML = TESTS.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    sel.value = settings.defaultTestId || "pushup";
  }

  function setBadge(text){ if(badge) badge.textContent = text; }
  function updateTitle(){
    const t = getTest(sel?.value || "pushup");
    if(title) title.textContent = t.name;
  }
  updateTitle();

  btnStats?.addEventListener("click", () => drawer?.classList.toggle("open"));
  sel?.addEventListener("change", () => { setSettings({ defaultTestId: sel.value }); updateTitle(); });

  controller.setCallbacks({
    onUpdate: (u) => {
      if(countEl) countEl.textContent = String(u.count ?? 0);
      if(chipTime) chipTime.textContent = u.elapsedText || "00:00";
      if(chipQuality){
        const q = u.quality?.total ?? u.quality ?? 0;
        chipQuality.textContent = `Quality: ${q || "—"}`;
      }
    },
    onEnded: ({ elapsedMs, summary }) => {
      btnStart.disabled = false;
      btnPause.disabled = true;
      btnEnd.disabled = true;

      btnStart.textContent = "START";
      btnPause.textContent = "PAUSE";

      setBadge("Ended • save it");

      openSaveModal({ elapsedMs, summary });
      refreshSideStats();
    },
    onError: (err) => {
      console.error(err);
      setBadge("Error");
      toast("Camera/pose error", err?.message || "Unknown error", "⚠️", 3800);
      btnStart.disabled = false;
      btnPause.disabled = true;
      btnEnd.disabled = true;
      btnStart.textContent = "START";
      btnPause.textContent = "PAUSE";
    }
  });

  btnStart?.addEventListener("click", async () => {
    const t = getTest(sel?.value || "pushup");
    const tracker = t.createTracker();

    btnStart.disabled = true;
    btnPause.disabled = false;
    btnEnd.disabled = false;
    btnStart.textContent = "RUNNING";

    setBadge("Starting camera…");

    await controller.start({ tracker, facingMode: "user" });
    setBadge("Tracking");
  });

  btnPause?.addEventListener("click", () => {
    controller.togglePause();
    const paused = controller.paused;
    btnPause.textContent = paused ? "RESUME" : "PAUSE";
    setBadge(paused ? "Paused" : "Tracking");
  });

  btnEnd?.addEventListener("click", () => controller.end());

  modalClose?.addEventListener("click", () => closeModal());
  modalWrap?.addEventListener("click", (e) => { if(e.target === modalWrap) closeModal(); });

  let pendingSave = null;

  function openSaveModal({ elapsedMs, summary }){
    pendingSave = { elapsedMs, summary };

    const t = getTest(sel?.value || "pushup");
    const q = summary?.quality?.total ?? summary?.quality ?? 0;

    if(modalTitle) modalTitle.textContent = "Save session";
    if(modalBody){
      modalBody.innerHTML = `
        <div class="kv"><div class="k">Test</div><div class="v">${escapeHTML(t.name)}</div></div>
        <div class="kv"><div class="k">${escapeHTML(metricLabel(t.id))}</div><div class="v">${escapeHTML(String(summary.count ?? 0))}</div></div>
        <div class="kv"><div class="k">Time</div><div class="v">${escapeHTML(formatDuration(elapsedMs))}</div></div>
        <div class="kv"><div class="k">Quality</div><div class="v">${escapeHTML(String(q || "—"))}</div></div>
        <hr class="sep" />
        <div class="field">
          <div class="label">Note (optional)</div>
          <input class="input" id="saveNote" placeholder="e.g., post-run, felt strong, etc." maxlength="140" />
          <div class="help">Saved locally on this device. No login yet.</div>
        </div>
      `;
    }

    if(modalWrap) modalWrap.classList.add("show");
    if(modalSave) modalSave.disabled = false;
  }

  function closeModal(){
    pendingSave = null;
    if(modalWrap) modalWrap.classList.remove("show");
  }

  modalSave?.addEventListener("click", () => {
    if(!pendingSave) return;

    const t = getTest(sel?.value || "pushup");
    const note = document.getElementById("saveNote")?.value?.trim() || "";

    const saved = addSession({
      testId: t.id,
      testName: t.name,
      count: pendingSave.summary.count ?? 0,
      durationMs: pendingSave.elapsedMs,
      quality: pendingSave.summary.quality ?? null,
      notes: note,
      metrics: pendingSave.summary.metrics ?? {}
    });

    closeModal();
    toast("Saved", `${saved.testName} • ${saved.count} ${metricLabel(saved.testId)}`, "💾");
    setBadge("Saved • tap START");
    refreshSideStats();
  });

  function refreshSideStats(){
    if(dToday) dToday.textContent = todayKey();
    if(dStreak) dStreak.textContent = `${getStreak()} days`;

    const t = getTest(sel?.value || "pushup");
    const pb = getPB(t.id);
    if(dPB) dPB.textContent = pb ? `${pb.count} ${metricLabel(t.id)}` : "—";

    const last = loadSessions().find(s => s.testId === t.id) || loadSessions()[0];
    if(dLast){
      if(last){
        const q = typeof last.quality === "object" ? last.quality?.total : last.quality;
        dLast.textContent = `${last.testName} • ${last.count} • Q${q ?? "—"} • ${formatDateShort(last.createdAt)}`;
      }else{
        dLast.textContent = "—";
      }
    }
  }

  refreshSideStats();
  setBadge("Ready • tap START");
}

/* ----------------------- Helpers ----------------------- */
function metricLabel(testId){
  const t = getTest(testId);
  return t.kind === "time" ? "seconds" : "reps";
}

function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function downloadText(filename, text, mime){
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
