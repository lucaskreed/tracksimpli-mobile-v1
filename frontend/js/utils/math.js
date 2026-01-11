export function clamp(x,a,b){
  return Math.min(b, Math.max(a,x));
}

export function average(arr){
  return arr.reduce((s,v)=>s+v,0)/arr.length;
}

export function stddev(arr){
  const avg = average(arr);
  return Math.sqrt(average(arr.map(x => (x-avg)**2)));
}
