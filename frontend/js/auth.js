import { supabase } from "./supabase.js";

const form = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");

// simple anti-spam + rate-limit friendly cooldown
let sending = false;
let lastSentAt = 0;
const COOLDOWN_MS = 60_000; // 60s

function setStatus(msg, type = "info") {
  if (!statusEl) return;
  statusEl.classList.remove("hidden", "text-slate-600", "text-red-600", "text-green-700");
  if (type === "error") statusEl.classList.add("text-red-600");
  else if (type === "success") statusEl.classList.add("text-green-700");
  else statusEl.classList.add("text-slate-600");
  statusEl.textContent = msg;
}

function setButton(loading) {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  const mode = form?.dataset?.authMode || "login";
  if (!loading) {
    submitBtn.textContent = mode === "signup" ? "Sign up with email" : "Continue with email";
  } else {
    submitBtn.textContent = "Sending…";
  }
}

if (form && emailInput) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      emailInput.focus();
      return;
    }

    // cooldown to avoid “email rate limit exceeded”
    const now = Date.now();
    if (now - lastSentAt < COOLDOWN_MS) {
      const secLeft = Math.ceil((COOLDOWN_MS - (now - lastSentAt)) / 1000);
      setStatus(`Please wait ${secLeft}s before requesting another email.`, "error");
      return;
    }

    if (sending) return;
    sending = true;
    setButton(true);
    setStatus("");

    const mode = form.dataset.authMode; // "login" or "signup"
    const shouldCreateUser = mode === "signup";

    const redirectTo = `${window.location.origin}/screens/dashboard.html`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser,
        emailRedirectTo: redirectTo,
      },
    });

    sending = false;
    setButton(false);

    if (error) {
      // common nice messages
      if (!shouldCreateUser && /user|sign up|signup|not found/i.test(error.message)) {
        setStatus("No account found for that email. Please sign up first.", "error");
      } else if (/rate limit/i.test(error.message)) {
        setStatus("Too many requests—wait a minute and try again.", "error");
      } else {
        setStatus(error.message, "error");
      }
      return;
    }

    lastSentAt = Date.now();
    setStatus("Check your email for the sign-in link.", "success");
  });
}
