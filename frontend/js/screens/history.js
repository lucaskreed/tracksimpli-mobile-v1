function init_history() {
  const screen = document.getElementById("screen-history");
  const sessions = JSON.parse(localStorage.getItem("history") || "[]");

  if (!sessions.length) {
    screen.innerHTML += `<div class="muted">No history yet.</div>`;
  }
}
