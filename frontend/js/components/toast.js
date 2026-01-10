let toastTimeout;

export function toast(message, duration = 2000) {
  let el = document.getElementById("toast");

  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    el.classList.remove("show");
  }, duration);
}
