import { pickBestKeypoint, clamp } from "../utils/math.js";
import { qualityFromPlankMetrics } from "../scoring/quality.js";

export function createPlankTracker(){
  return new PlankTracker();
}

class PlankTracker{
  constructor(){ this.reset(); }

  reset(){
    this.startPoseTs = 0;
    this.heldMs = 0;
    this.lastTs = 0;

    this.stableSamples = 0;
    this.totalSamples = 0;

    this.lastQuality = { total: 0, stability: 0 };
  }

  onPose(kps, now){
    const shoulder = pickBestKeypoint(kps, 5, 6);
    const hip = pickBestKeypoint(kps, 11, 12);

    if(!ok(shoulder) || !ok(hip)){
      this.lastTs = now;
      return;
    }

    if(!this.startPoseTs) this.startPoseTs = now;
    if(!this.lastTs) this.lastTs = now;

    const dt = now - this.lastTs;
    this.lastTs = now;

    // crude "stability": hip and shoulder y difference should not oscillate wildly
    const dy = Math.abs(hip.y - shoulder.y);
    const stable = dy < 140;

    this.totalSamples += 1;
    if(stable) this.stableSamples += 1;

    this.heldMs += Math.max(0, dt);

    const pct = this.totalSamples ? (this.stableSamples / this.totalSamples) * 100 : 0;
    this.lastQuality = qualityFromPlankMetrics({ stablePct: clamp(pct, 0, 100) });
  }

  getState(){
    // plank uses "count" as seconds held (rounded)
    const seconds = Math.floor(this.heldMs / 1000);
    return {
      count: seconds,
      quality: this.lastQuality,
      phase: "hold"
    };
  }

  getSummary({ elapsedMs }){
    const seconds = Math.floor(this.heldMs / 1000);
    return {
      count: seconds,
      durationMs: elapsedMs,
      quality: this.lastQuality,
      metrics: {
        heldMs: this.heldMs
      }
    };
  }
}

function ok(kp){ return (kp?.score ?? 0) > 0.35; }
