export function createSessionState() {
  return {
    running: false,
    paused: false,

    reps: 0,
    down: false,
    lastPhase: Date.now(),

    startTs: 0,
    pauseAccumMs: 0,
    pauseStart: 0,

    minElbow: 180,
    alignSamples: [],
    repTimes: [],
    lastRepTs: 0
  };
}
