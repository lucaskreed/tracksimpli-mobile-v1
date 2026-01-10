function init_dashboard() {
  // Placeholder data for now
  const last = JSON.parse(localStorage.getItem("last_session") || "null");

  if (last) {
    const card = document.querySelector(".card");
    card.innerHTML = `
      <div class="muted">Last Test</div>
      <div style="font-size:32px;font-weight:900;margin-top:6px;">
        ${last.reps} reps
      </div>
      <div class="muted">Quality ${last.quality}</div>
    `;
  }
}
