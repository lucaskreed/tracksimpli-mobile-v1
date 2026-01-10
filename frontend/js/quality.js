export function clamp(x,a,b){ return Math.min(b, Math.max(a, x)); }

export function mapRange(x,inMin,inMax,outMin,outMax){
  const t = (x - inMin) / (inMax - inMin);
  return outMin + t*(outMax - outMin);
}

export function average(arr){ return arr.reduce((s,v)=>s+v,0)/arr.length; }

export function stddev(arr){
  const avg = average(arr);
  const v = average(arr.map(x => (x-avg)*(x-avg)));
  return Math.sqrt(v);
}

// Computes a stable, explainable quality score.
// state: { minElbow, alignSamples[], repTimes[] }
export function computeQuality(state){
  const minElbow = state.minElbow ?? 180;

  // Depth: lower minElbow => deeper
  const depth = clamp(mapRange(minElbow, 120, 80, 0, 100), 0, 100);

  // Tempo: reward consistent reps, punish bounce
  let tempo = 50;
  if(state.repTimes?.length >= 2){
    const avg = average(state.repTimes)/1000;
    const sd = stddev(state.repTimes)/1000;
    const speedScore = clamp(mapRange(avg, 0.8, 2.2, 20, 100), 0, 100);
    const consistencyScore = clamp(mapRange(sd, 0.9, 0.15, 30, 100), 0, 100);
    tempo = Math.round(0.6*speedScore + 0.4*consistencyScore);
  }

  // Alignment: smaller hip/shoulder delta => straighter
  let align = 60;
  if(state.alignSamples?.length){
    const a = average(state.alignSamples);
    align = clamp(mapRange(a, 160, 90, 30, 100), 0, 100);
  }

  const total = Math.round(0.45*depth + 0.30*tempo + 0.25*align);
  return { total, depth: Math.round(depth), tempo, align: Math.round(align) };
}

export function mmss(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const m = Math.floor(s/60);
  const r = s%60;
  return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
}
