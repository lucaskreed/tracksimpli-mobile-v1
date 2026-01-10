export function mountNavbar(active = "dashboard") {
  const nav = document.createElement("div");
  nav.className = "navbar";
  nav.innerHTML = `
    <button data-screen="dashboard">Home</button>
    <button data-screen="test">Test</button>
    <button data-screen="history">History</button>
    <button data-screen="settings">Settings</button>
  `;

  nav.querySelectorAll("button").forEach(btn => {
    if (btn.dataset.screen === active) btn.classList.add("active");
    btn.onclick = () => navigate(btn.dataset.screen);
  });

  document.body.appendChild(nav);
}
