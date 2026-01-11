export async function startCamera(videoEl, { facingMode = "user" } = {}){
  if(!navigator.mediaDevices?.getUserMedia){
    throw new Error("Camera not supported in this browser.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: false
  });

  videoEl.srcObject = stream;
  videoEl.setAttribute("playsinline", "");
  videoEl.muted = true;

  await videoEl.play();
  return stream;
}

export function stopCamera(stream){
  try{
    stream?.getTracks?.().forEach(t => t.stop());
  }catch{}
}
