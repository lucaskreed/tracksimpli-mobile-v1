import { todayKey, daysBetween } from "../utils/time.js";
import { uid } from "../utils/math.js";

const KEY = "tracksimpli_sessions_v2";
const SETTINGS_KEY = "tracksimpli_settings_v1";

export function loadSessions(){
  try{
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{
    return [];
  }
}

export function saveSessions(list){
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addSession(session){
  const list = loadSessions();
  const s = {
    id: session.id || uid(),
    createdAt: session.createdAt || Date.now(),
    date: session.date || todayKey(),
    testId: session.testId || "unknown",
    testName: session.testName || session.testId || "Unknown",
    count: Number(session.count ?? 0),
    durationMs: Number(session.durationMs ?? 0),
    quality: session.quality ?? null,
    notes: (session.notes || "").slice(0, 140),
    metrics: session.metrics ?? {},
  };
  list.unshift(s);
  saveSessions(list.slice(0, 250));
  return s;
}

export function clearSessions(){
  localStorage.removeItem(KEY);
}

export function getPB(testId = null){
  const list = loadSessions();
  const filtered = testId ? list.filter(s => s.testId === testId) : list;
  if(!filtered.length) return null;
  return filtered.reduce((best, s) => (s.count > (best?.count ?? -Infinity) ? s : best), null);
}

export function getTodayCount(){
  const t = todayKey();
  return loadSessions().filter(s => s.date === t).length;
}

export function getStreak(){
  const list = loadSessions();
  if(!list.length) return 0;

  const days = new Set(list.map(s => s.date));
  let streak = 0;
  let d = todayKey();

  while(days.has(d)){
    streak += 1;
    const prev = new Date(`${d}T00:00:00`);
    prev.setDate(prev.getDate() - 1);
    d = todayKey(prev);
  }
  return streak;
}

export function exportSessionsJSON(){
  const list = loadSessions();
  return JSON.stringify(list, null, 2);
}

export function getSettings(){
  try{
    const raw = localStorage.getItem(SETTINGS_KEY);
    const s = raw ? JSON.parse(raw) : {};
    return {
      mirrorFrontCamera: Boolean(s?.mirrorFrontCamera ?? true),
      defaultTestId: String(s?.defaultTestId ?? "pushup"),
    };
  }catch{
    return { mirrorFrontCamera: true, defaultTestId: "pushup" };
  }
}

export function setSettings(patch){
  const current = getSettings();
  const next = { ...current, ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function buildChallengeURL(session){
  const url = new URL(window.location.href);
  url.searchParams.set("challenge", "1");
  url.searchParams.set("test", session.testId);
  url.searchParams.set("count", String(session.count));
  url.searchParams.set("q", String(session.quality?.total ?? session.quality ?? ""));
  url.searchParams.set("t", String(Math.round((session.durationMs ?? 0)/1000)));
  url.searchParams.set("d", String(session.date ?? ""));
  return url.toString();
}

export function getChallengeFromURL(){
  const p = new URLSearchParams(window.location.search);
  if(p.get("challenge") !== "1") return null;
  return {
    testId: p.get("test") || "unknown",
    count: Number(p.get("count") || 0),
    quality: p.get("q") || "",
    seconds: Number(p.get("t") || 0),
    date: p.get("d") || "",
  };
}
