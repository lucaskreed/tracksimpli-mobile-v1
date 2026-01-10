export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stddev(arr) {
  const avg = average(arr);
  const variance = average(arr.map(v => (v - avg) ** 2));
  return Math.sqrt(variance);
}
