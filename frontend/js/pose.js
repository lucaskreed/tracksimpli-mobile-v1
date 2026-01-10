let detector = null;

export async function initDetector() {
  if (detector) return detector;

  if (!globalThis.poseDetection) {
    throw new Error("poseDetection not loaded. Check CDN scripts in index.html.");
  }

  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  );

  return detector;
}

export function angle(a,b,c){
  const ab=[a.x-b.x,a.y-b.y], cb=[c.x-b.x,c.y-b.y];
  const dot=ab[0]*cb[0]+ab[1]*cb[1];
  const mag=Math.hypot(...ab)*Math.hypot(...cb);
  return mag ? Math.acos(dot/mag)*180/Math.PI : 180;
}

export function pickKeypoints(pose){
  const kps = pose.keypoints || [];

  // Prefer named keypoints
  const byName = (name) => kps.find(k => k.name === name) || null;

  const leftShoulder = byName("left_shoulder") ?? kps[5] ?? null;
  const leftElbow    = byName("left_elbow")    ?? kps[7] ?? null;
  const leftWrist    = byName("left_wrist")    ?? kps[9] ?? null;
  const leftHip      = byName("left_hip")      ?? kps[11] ?? null;

  return { leftShoulder, leftElbow, leftWrist, leftHip };
}

export function ok(kp, min=0.25){
  return kp && (kp.score ?? 0) >= min;
}

export function drawDot(ctx, p, color){
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7, 0, Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawLine(ctx, a, b, color){
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

export async function estimateSinglePose(video) {
  const det = await initDetector();
  const poses = await det.estimatePoses(video);
  return poses?.[0] ?? null;
}
