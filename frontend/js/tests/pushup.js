export const pushup = {
  id: "pushup",
  name: "Pushups",
  mode: "reps",

  joints: ["shoulder", "elbow", "wrist", "hip"],

  thresholds: {
    downAngle: 85,
    upAngle: 165
  },

  score(metrics) {
    // return 0–100
  }
};
