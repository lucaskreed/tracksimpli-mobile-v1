import { mmss } from "./quality.js";

export function buildChallengeURL(session){
  const url = new URL(window.location.href);
  url.searchParams.set("challenge", "1");
  url.searchParams.set("reps", String(session.reps));
  url.searchParams.set("q", String(session.quality.total));
  url.searchParams.set("t", String(Math.round(session.elapsedMs/1000)));
  url.searchParams.set("d", session.date);
  return url.toString();
}

export function showChallengeBannerFromURL(el){
  const p = new URLSearchParams(window.location.search);
  if(p.get("challenge") !== "1") return;

  const reps = p.get("reps") || "?";
  const q = p.get("q") || "?";
  const t = p.get("t") || "?";
  const d = p.get("d") || "";
  el.style.display = "block";
  el.innerHTML = `<b>Challenge:</b> Beat <b>${reps}</b> reps (Q${q}, ${t}s) ${d ? "• " + d : ""}`;
}

export async function makeShareImage(canvas, session){
  const w = 1080, h = 1920;
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext("2d");

  // background
  g.fillStyle = "#0b0d10";
  g.fillRect(0,0,w,h);

  // gradient
  const grad = g.createLinearGradient(0,0,0,h);
  grad.addColorStop(0, "rgba(42,60,255,.25)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0,0,w,h);

  // title
  g.fillStyle = "white";
  g.font = "900 70px system-ui, -apple-system, Segoe UI, Roboto";
  g.fillText("TrackSimpli", 70, 140);

  g.fillStyle = "rgba(255,255,255,.75)";
  g.font = "700 36px system-ui, -apple-system, Segoe UI, Roboto";
  g.fillText("Pushups", 70, 200);

  // big reps
  g.fillStyle = "white";
  g.font = "900 220px system-ui, -apple-system, Segoe UI, Roboto";
  g.fillText(String(session.reps), 70, 520);

  g.fillStyle = "rgba(255,255,255,.75)";
  g.font = "900 44px system-ui, -apple-system, Segoe UI, Roboto";
  g.fillText("REPS", 70, 590);

  // stats
  drawStat(g, 70, 720, "Quality", String(session.quality.total));
  drawStat(g, 70, 840, "Time", mmss(session.elapsedMs));
  drawStat(g, 70, 960, "Depth (min elbow)", session.minElbow + "°");
  drawStat(g, 70, 1080, "Avg rep tempo", session.avgRepMs ? (session.avgRepMs/1000).toFixed(2)+"s" : "—");

  g.fillStyle = "rgba(255,255,255,.60)";
  g.font = "700 32px system-ui, -apple-system, Segoe UI, Roboto";
  g.fillText(session.date + (session.label ? " • " + session.label : ""), 70, 1780);

  g.fillStyle = "rgba(255,255,255,.60)";
  g.font = "700 28px system-ui, -apple-system, Segoe UI, Roboto";
  g.fillText("Beat my score → (challenge link)", 70, 1840);

  return await new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.92));
}

function drawStat(g, x, y, k, v){
  g.fillStyle = "rgba(255,255,255,.55)";
  g.font = "900 36px system-ui, -apple-system, Segoe UI, Roboto";
  g.fillText(k.toUpperCase(), x, y);

  g.fillStyle = "white";
  g.font = "900 60px system-ui, -apple-system, Segoe UI, Roboto";
  g.fillText(String(v), x, y+72);

  g.fillStyle = "rgba(255,255,255,.10)";
  g.fillRect(x, y+102, 940, 2);
}

export async function shareSession({ canvas, session }) {
  const link = buildChallengeURL(session);
  const text = `TrackSimpli Pushups: ${session.reps} reps • Quality ${session.quality.total} • Time ${mmss(session.elapsedMs)}\nChallenge: ${link}`;

  const blob = await makeShareImage(canvas, session);

  try{
    if(navigator.share && blob){
      const file = new File([blob], "tracksimpli.png", { type:"image/png" });
      await navigator.share({ title: "TrackSimpli", text, files: [file], url: link });
      return { ok: true, mode: "native" };
    }
  }catch{}

  // Fallback: copy link + download image
  try { await navigator.clipboard.writeText(link); } catch {}
  if(blob){
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tracksimpli.png";
    a.click();
    URL.revokeObjectURL(url);
  }

  return { ok: true, mode: "fallback" };
}
