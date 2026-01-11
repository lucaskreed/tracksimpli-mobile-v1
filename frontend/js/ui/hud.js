export function startLoop({
  video,
  detector,
  test,
  state,
  onRep,
  onFrame
}) {
  async function frame() {
    if (!state.running || state.paused) return;

    const poses = await detector.estimatePoses(video);

    if (poses[0]) {
      const landmarks = poses[0].keypoints;

      // Let the active test evaluate this frame
      const result = test.evaluate(landmarks, state);

      // If a rep happened, notify UI
      if (result?.rep) {
        onRep?.(state);
      }
    }

    // Always notify UI per frame (time, quality, etc.)
    onFrame?.(state);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
