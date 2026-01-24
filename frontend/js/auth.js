import { supabase } from "./supabase.js";

const form = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const googleBtn = document.getElementById("googleBtn");

function setStatus(msg, type = "info") {
  if (!statusEl) return;
  statusEl.classList.remove("hidden", "text-slate-600", "text-red-600", "text-green-700");
  if (type === "error") statusEl.classList.add("text-red-600");
  else if (type === "success") statusEl.classList.add("text-green-700");
  else statusEl.classList.add("text-slate-600");
  statusEl.textContent = msg;
}

function setLoading(isLoading, btn, textWhenLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  if (isLoading) btn.textContent = textWhenLoading;
}

const DASHBOARD_URL = `${window.location.origin}/screens/dashboard.html`;

// If already signed in, skip auth pages
{
  const { data } = await supabase.auth.getSession();
  if (data.session) window.location.href = "../screens/dashboard.html";
}

// Password login/signup
if (form && emailInput && passwordInput) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const mode = form.dataset.mode; // "login" | "signup"
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) return emailInput.focus();
    if (!password) return passwordInput.focus();

    try {
      setLoading(true, submitBtn, mode === "signup" ? "Creating…" : "Signing in…");

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) throw error;

        // If email confirmations are ON, user might need to confirm before session exists
        if (!data.session) {
          setStatus("Account created. Check your email to confirm, then log in.", "success");
        } else {
          window.location.href = "../screens/dashboard.html";
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        window.location.href = "../screens/dashboard.html";
      }
    } catch (err) {
      const msg = err?.message || "Something went wrong.";
      setStatus(msg, "error");
    } finally {
      setLoading(false, submitBtn, mode === "signup" ? "Create account" : "Log in");
    }
  });
}

// Google OAuth (works on both pages)
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    setStatus("");
    setLoading(true, googleBtn, "Redirecting…");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://www.capableapp.co/screens/dashboard.html",
      },
    });

    if (error) {
      setLoading(false, googleBtn, "Continue with Google");
      setStatus(error.message, "error");
    }
  });
}
