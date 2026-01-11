export async function startCamera(video){
  const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user" } });
  video.srcObject = stream;
  await video.play();
  return stream;
}
