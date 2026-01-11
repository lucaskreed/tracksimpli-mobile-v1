import { estimateSinglePose } from "./pose.js";
import { startCamera, stopCamera } from "./camera.js";
import { mmss } from "../utils/time.js";

export class WorkoutController{
  constructor({ videoEl, canvasEl, mirror = true }){
    this.videoEl = videoEl;
    this.canvasEl = canvasEl;
    this.ctx = canvasEl.getContext("2d");
    this.mirror = mirror;

    this.running = false;
    this.paused = false;

    this.stream = null;
    this.tracker = null;

    this.startTs = 0;
    this.pauseTs = 0;
    this.pauseAccum = 0;

    this.onUpdate = () => {};
    this.onEnded = () => {};
    this.onError = () => {};
  }

  setCallbacks({ onUpdate, onEnded, onError }){
    if(onUpdate) this.onUpdate = onUpdate;
    if(onEnded) this.onEnded = onEnded;
    if(onError) this.onError = onError;
  }

  async start({ tracker, facingMode = "user" }){
    try{
      if(this.running) return;
      this.tracker = tracker;
      this.tracker.reset();

      this.stream = await startCamera(this.videoEl, { facingMode });

      this.canvasEl.width = this.videoEl.videoWidth || 1280;
      this.canvasEl.height = this.videoEl.videoHeight || 720;

      this.running = true;
      this.paused = false;
      this.startTs = Date.now();
      this.pauseAccum = 0;
      this.pauseTs = 0;

      this._tick();
    }catch(err){
      this.onError(err);
    }
  }

  togglePause(){
    if(!this.running) return;
    this.paused = !this.paused;

    if(this.paused){
      this.pauseTs = Date.now();
    }else{
      this.pauseAccum += (Date.now() - this.pauseTs);
      this.pauseTs = 0;
      this._tick();
    }
  }

  async end(){
    if(!this.running) return;
    this.running = false;
    this.paused = false;

    const elapsedMs = (Date.now() - this.startTs) - this.pauseAccum;

    stopCamera(this.stream);
    this.stream = null;

    try{ this.ctx.clearRect(0,0,this.canvasEl.width,this.canvasEl.height); }catch{}
    const summary = this.tracker.getSummary({ elapsedMs });

    this.onEnded({ elapsedMs, summary, tracker: this.tracker });
  }

  async _tick(){
    if(!this.running || this.paused) return;

    const now = Date.now();
    const elapsedMs = (now - this.startTs) - this.pauseAccum;

    try{
      const pose = await estimateSinglePose(this.videoEl);
      this.ctx.clearRect(0,0,this.canvasEl.width,this.canvasEl.height);

      if(pose?.keypoints?.length){
        this.tracker.onPose(pose.keypoints, now);

        if(this.tracker.draw){
          this.tracker.draw(this.ctx, pose.keypoints, this.canvasEl.width, this.canvasEl.height);
        }else{
          drawKeypointsSimple(this.ctx, pose.keypoints);
        }
      }

      const state = this.tracker.getState();
      this.onUpdate({
        elapsedMs,
        elapsedText: mmss(elapsedMs),
        ...state
      });

      requestAnimationFrame(() => this._tick());
    }catch(err){
      this.onError(err);
    }
  }
}

function drawKeypointsSimple(ctx, kps){
  const good = (kp) => (kp?.score ?? 0) > 0.35;
  const dot = (p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI*2);
    ctx.fillStyle = "rgba(40,209,124,.95)";
    ctx.fill();
  };

  for(const p of kps){
    if(good(p)) dot(p);
  }
}
