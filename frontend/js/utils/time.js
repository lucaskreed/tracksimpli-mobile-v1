export function pad2(n){ return String(n).padStart(2,"0"); }

export function todayKey(d = new Date()){
  const y = d.getFullYear();
  const m = pad2(d.getMonth()+1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function mmss(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const m = Math.floor(s/60);
  const r = s%60;
  return `${pad2(m)}:${pad2(r)}`;
}

export function formatDuration(ms){
  const s = Math.max(0, Math.round(ms/1000));
  if(s < 60) return `${s}s`;
  const m = Math.floor(s/60);
  const r = s%60;
  return `${m}m ${r}s`;
}

export function formatDateShort(ts){
  const d = new Date(ts);
  const opts = { month:"short", day:"numeric" };
  return d.toLocaleDateString(undefined, opts);
}

export function daysBetween(aKey, bKey){
  const a = new Date(`${aKey}T00:00:00`);
  const b = new Date(`${bKey}T00:00:00`);
  return Math.round((b - a) / (1000*60*60*24));
}
