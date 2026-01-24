import { supabase } from "./supabase.js";

const form = document.getElementById("updateForm");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("updateBtn");
const statusEl = document.getElementById("status");

function setStatus(msg, type = "info") {
  if (!statusEl) return;
  statusEl.classList.remove("hidden", "text-slate-600", "text-red-600", "text-green-700");
  if (type === "error") statusEl.classList.add("text-red-600");
  else if (type === "success") statusEl.classList.add("text-green-700");
  else statusEl.classList.add("text-slate-600");
  statusEl.textContent = msg;
}

if (form && passwordInput) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const password = passwordInput.value;
    if (!password || password.length < 8) {
      return setStatus("Password must be at least 8 characters.", "error");
    }

    btn.disabled = true;
    btn.textContent = "Updating…";

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus(error.message, "error");
      btn.disabled = false;
      btn.textContent = "Update password";
      return;
    }

    setStatus("Password updated. Redirecting to login…", "success");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1000);
  });
}
