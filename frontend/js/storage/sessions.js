export const STORE_KEY = "tracksimpli_history_v1";
export const PB_KEY = "tracksimpli_pb_v1";
export const STREAK_KEY = "tracksimpli_streak_v1";

export function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}
