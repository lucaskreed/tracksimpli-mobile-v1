import { angleDeg, pickBestKeypoint, clamp } from "../utils/math.js";
import { qualityFromPushupMetrics } from "../scoring/quality.js";

export function createPushupTracker(){
  return new PushupTracker();
}

class PushupTracker{
  constructor(){
    this.reset();
  }

  reset(){
    this.count = 0;
    this.down = false;
    this.lastPhase = Date.now();

    this.minElbow = 180;
    this.alignSamples = [];
    this.repTimes = [];
    this.lastRepTs = 0;

    this.lastQuality = { total: 0, depth: 0, tempo: 0, align: 0 };
  }

  onPose(kps, now){
    const s = pickBestKeypoint(kps, 5, 6);   // shoulders
    const e = pickBestKeypoint(kps, 7, 8);   // elbows
    const w = pickBestKeypoint(kps, 9, 10);  // wrists
    const h = pickBestKeypoint(kps, 11, 12); // hips

    if(!ok(s) || !ok(e) || !ok(w) || !ok(h)) return;

    const elbow = angleDeg(s, e, w);
    this.minElbow = Math.min(this.minElbow, elbow);

    const align = Math.abs(h.y - s.y);
    this.alignSamples.push(align);
    if(this.alignSamples.length > 180) this.alignSamples.shift();

    // Down phase: elbow bends deep
    if(elbow < 85 && !this.down && now - this.lastPhase > 450){
      this.down = true;
      this.lastPhase = now;
    }

    // Up phase: elbow extended + body not collapsing (rough check)
    if(elbow > 165 && this.down && now - this.lastPhase > 350 && align < 130){
      this.count += 1;
      this.down = false;
      this.lastPhase = now;

      if(this.lastRepTs){
        this.repTimes.push(now - this.lastRepTs);
        if(this.repTimes.length > 60) this.repTimes.shift();
      }
      this.lastRepTs = now;
    }

    this.lastQuality = qualityFromPushupMetrics({
      minElbow: this.minElbow,
      repTimes: this.repTimes,
      alignSamples: this.alignSamples
    });
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
        minElbow: Math.round(clamp(this.minElbow, 0, 180)),
        avgRepMs: this.repTimes.length ? Math.round(this.repTimes.reduce((s,v)=>s+v,0)/this.repTimes.length) : null
      }
    };
  }

  draw(ctx, kps){
    const s = pickBestKeypoint(kps, 5, 6);
    const e = pickBestKeypoint(kps, 7, 8);
    const w = pickBestKeypoint(kps, 9, 10);
    const h = pickBestKeypoint(kps, 11, 12);

    const drawDot = (p, color) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const drawLine = (a,b, color) => {
      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    if(ok(s)) drawDot(s, "rgba(40,209,124,.95)");
    if(ok(e)) drawDot(e, "rgba(40,209,124,.95)");
    if(ok(w)) drawDot(w, "rgba(40,209,124,.95)");
    if(ok(h)) drawDot(h, "rgba(255,255,255,.75)");

    if(ok(s) && ok(e)) drawLine(s,e,"rgba(40,209,124,.85)");
    if(ok(e) && ok(w)) drawLine(e,w,"rgba(40,209,124,.85)");
    if(ok(s) && ok(h)) drawLine(s,h,"rgba(255,255,255,.55)");
  }
}

function ok(kp){ return (kp?.score ?? 0) > 0.35; }
