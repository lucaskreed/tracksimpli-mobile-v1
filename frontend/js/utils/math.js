export function clamp(x, min, max){ return Math.min(max, Math.max(min, x)); }

export function mapRange(x, inMin, inMax, outMin, outMax){
  const t = (x - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

export function avg(arr){
  if(!arr?.length) return 0;
  return arr.reduce((s,v)=>s+v,0) / arr.length;
}

export function stddev(arr){
  if(!arr?.length) return 0;
  const m = avg(arr);
  const v = avg(arr.map(x => (x-m)*(x-m)));
  return Math.sqrt(v);
}

export function uid(){
  try{
    const a = new Uint32Array(4);
    crypto.getRandomValues(a);
    return [...a].map(n => n.toString(16).padStart(8,"0")).join("-");
  }catch{
    return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
  }
}

export function pickBestKeypoint(keypoints, idxA, idxB){
  const a = keypoints?.[idxA];
  const b = keypoints?.[idxB];
  if(!a && !b) return null;
  if(a && !b) return a;
  if(!a && b) return b;
  return (a.score ?? 0) >= (b.score ?? 0) ? a : b;
}

export function angleDeg(a,b,c){
  const abx = a.x - b.x, aby = a.y - b.y;
  const cbx = c.x - b.x, cby = c.y - b.y;
  const dot = abx*cbx + aby*cby;
  const mag = Math.hypot(abx,aby) * Math.hypot(cbx,cby);
  if(!mag) return 180;
  const v = clamp(dot/mag, -1, 1);
  return Math.acos(v) * 180 / Math.PI;
}
