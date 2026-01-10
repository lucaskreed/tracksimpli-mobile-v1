export const STORE_KEY = "tracksimpli_history_v2";
export const PB_KEY = "tracksimpli_pb_v2";
export const STREAK_KEY = "tracksimpli_streak_v2";

export function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function todayStr(){
  const d = new Date();
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

export function clearAll() {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(PB_KEY);
  localStorage.removeItem(STREAK_KEY);
}

export function getHistory() {
  return loadJSON(STORE_KEY, []);
}

export function setHistory(hist) {
  saveJSON(STORE_KEY, hist);
}

export function getPB() {
  return loadJSON(PB_KEY, { reps: 0, quality: 0 });
}

export function setPB(pb) {
  saveJSON(PB_KEY, pb);
}

export function getStreak() {
  return loadJSON(STREAK_KEY, { lastDate: null, count: 0 });
}

export function setStreak(st) {
  saveJSON(STREAK_KEY, st);
}
