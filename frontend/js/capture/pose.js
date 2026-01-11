let detectorPromise = null;

function ensurePoseLib(){
  const pd = window.poseDetection;
  if(!pd){
    throw new Error("Pose library not loaded. Make sure TFJS + pose-detection scripts are included on this page.");
  }
  return pd;
}

export async function getDetector(){
  if(detectorPromise) return detectorPromise;
  const poseDetection = ensurePoseLib();

  detectorPromise = poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  );

  return detectorPromise;
}

export async function estimateSinglePose(videoEl){
  const detector = await getDetector();
  const poses = await detector.estimatePoses(videoEl, { maxPoses: 1, flipHorizontal: false });
  return poses?.[0] ?? null;
}
