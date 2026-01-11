import { clamp, mapRange, avg, stddev } from "../utils/math.js";

export function qualityFromPushupMetrics({ minElbow = 180, repTimes = [], alignSamples = [] }){
  const depth = clamp(mapRange(minElbow, 120, 80, 0, 100), 0, 100);

  let tempo = 50;
  if(repTimes.length >= 2){
    const a = avg(repTimes)/1000;
    const s = stddev(repTimes)/1000;
    const speed = clamp(mapRange(a, 0.8, 2.2, 20, 100), 0, 100);
    const consistency = clamp(mapRange(s, 0.9, 0.15, 30, 100), 0, 100);
    tempo = Math.round(0.6*speed + 0.4*consistency);
  }

  let align = 60;
  if(alignSamples.length){
    const a = avg(alignSamples);
    align = clamp(mapRange(a, 160, 90, 30, 100), 0, 100);
  }

  const total = Math.round(0.45*depth + 0.30*tempo + 0.25*align);
  return { total, depth: Math.round(depth), tempo: Math.round(tempo), align: Math.round(align) };
}

export function qualityFromSquatMetrics({ minKnee = 180, repTimes = [] }){
  const depth = clamp(mapRange(minKnee, 125, 75, 0, 100), 0, 100);

  let tempo = 55;
  if(repTimes.length >= 2){
    const a = avg(repTimes)/1000;
    const s = stddev(repTimes)/1000;
    const speed = clamp(mapRange(a, 1.0, 2.8, 25, 100), 0, 100);
    const consistency = clamp(mapRange(s, 1.2, 0.25, 30, 100), 0, 100);
    tempo = Math.round(0.6*speed + 0.4*consistency);
  }

  const total = Math.round(0.6*depth + 0.4*tempo);
  return { total, depth: Math.round(depth), tempo: Math.round(tempo) };
}

export function qualityFromPlankMetrics({ stablePct = 0 }){
  const stability = clamp(stablePct, 0, 100);
  const total = Math.round(stability);
  return { total, stability: total };
}
