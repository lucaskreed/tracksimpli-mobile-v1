import { createPushupTracker } from "./pushup.js";
import { createSquatTracker } from "./squat.js";
import { createPlankTracker } from "./plank.js";

export const TESTS = [
  {
    id: "pushup",
    name: "Pushups",
    kind: "reps",
    desc: "Counts clean pushups using elbow angle + body alignment.",
    createTracker: createPushupTracker
  },
  {
    id: "squat",
    name: "Squats",
    kind: "reps",
    desc: "Counts squats using knee angle.",
    createTracker: createSquatTracker
  },
  {
    id: "plank",
    name: "Plank",
    kind: "time",
    desc: "Measures hold time with simple stability scoring.",
    createTracker: createPlankTracker
  }
];

export function getTest(id){
  return TESTS.find(t => t.id === id) || TESTS[0];
}
