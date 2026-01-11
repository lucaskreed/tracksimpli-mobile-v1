import { angleDeg, pickBestKeypoint, clamp } from "../utils/math.js";
import { qualityFromSquatMetrics } from "../scoring/quality.js";

export function createSquatTracker(){
  return new SquatTracker();
}

class SquatTracker{
  constructor(){ this.reset(); }

  reset(){
    this.count = 0;
    this.down = false;
    this.lastPhase = Date.now();

    this.minKnee = 180;
    this.repTimes = [];
    this.lastRepTs = 0;

    this.lastQuality = { total: 0, depth: 0, tempo: 0 };
  }

  onPose(kps, now){
    const hip = pickBestKeypoint(kps, 11, 12);
    const knee = pickBestKeypoint(kps, 13, 14);
    const ankle = pickBestKeypoint(kps, 15, 16);

    if(!ok(hip) || !ok(knee) || !ok(ankle)) return;

    const kneeAng = angleDeg(hip, knee, ankle);
    this.minKnee = Math.min(this.minKnee, kneeAng);

    if(kneeAng < 95 && !this.down && now - this.lastPhase > 450){
      this.down = true;
      this.lastPhase = now;
    }

    if(kneeAng > 160 && this.down && now - this.lastPhase > 350){
      this.count += 1;
      this.down = false;
      this.lastPhase = now;

      if(this.lastRepTs){
        this.repTimes.push(now - this.lastRepTs);
        if(this.repTimes.length > 60) this.repTimes.shift();
      }
      this.lastRepTs = now;
    }

    this.lastQuality = qualityFromSquatMetrics({ minKnee: this.minKnee, repTimes: this.repTimes });
  }

  getState(){
    return {
      count: this.count,
      quality: this.lastQuality,
      phase: this.down ? "down" : "up"
    };
  }

  getSummary({ elapsedMs }){
    const q = this.lastQuality;
    return {
      count: this.count,
      durationMs: elapsedMs,
      quality: q,
      metrics: {
        minKnee: Math.round(clamp(this.minKnee, 0, 180)),
        avgRepMs: this.repTimes.length ? Math.round(this.repTimes.reduce((s,v)=>s+v,0)/this.repTimes.length) : null
      }
    };
  }
}

function ok(kp){ return (kp?.score ?? 0) > 0.35; }
