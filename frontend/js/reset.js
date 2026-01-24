import { supabase } from "./supabase.js";

const form = document.getElementById("resetForm");
const emailInput = document.getElementById("email");
const btn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");

function setStatus(msg, type = "info") {
  if (!statusEl) return;
  statusEl.classList.remove("hidden", "text-slate-600", "text-red-600", "text-green-700");
  if (type === "error") statusEl.classList.add("text-red-600");
  else if (type === "success") statusEl.classList.add("text-green-700");
  else statusEl.classList.add("text-slate-600");
  statusEl.textContent = msg;
}

if (form && emailInput) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const email = emailInput.value.trim();
    if (!email) return emailInput.focus();

    btn.disabled = true;
    btn.textContent = "Sending…";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password.html`,
    });

    if (error) setStatus(error.message, "error");
    else setStatus("Check your email for the reset link.", "success");

    btn.disabled = false;
    btn.textContent = "Send reset link";
  });
}
