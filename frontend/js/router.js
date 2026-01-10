const screens = {};

async function loadScreen(name) {
  if (screens[name]) return screens[name];

  const res = await fetch(`screens/${name}.html`);
  const html = await res.text();
  screens[name] = html;
  return html;
}

async function navigate(name) {
  const app = document.getElementById("app");
  const html = await loadScreen(name);
  app.innerHTML = html;

  // Call screen-specific init if it exists
  const fn = window[`init_${name}`];
  if (typeof fn === "function") fn();
}

// Default export (optional mental anchor)
window.navigate = navigate;
