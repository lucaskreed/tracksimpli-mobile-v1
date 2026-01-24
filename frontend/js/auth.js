import { supabase } from "./supabase.js";

const form = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const googleBtn = document.getElementById("googleBtn");

const DASHBOARD_REL = "../screens/dashboard.html";

function setStatus(msg, type = "info") {
  if (!statusEl) return;
  statusEl.classList.remove("hidden", "text-slate-600", "text-red-600", "text-green-700");
  if (type === "error") statusEl.classList.add("text-red-600");
  else if (type === "success") statusEl.classList.add("text-green-700");
  else statusEl.classList.add("text-slate-600");
  statusEl.textContent = msg;
}

function setBtn(btn, loading, loadingText, normalText) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? loadingText : normalText;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// If already logged in, skip auth pages
{
  const { data } = await supabase.auth.getSession();
  if (data.session) window.location.href = DASHBOARD_REL;
}

// Google OAuth (works on both login/signup pages)
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    setStatus("");
    setBtn(googleBtn, true, "Redirecting…", "Continue with Google");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Works on localhost and production (as long as you add redirect URLs in Supabase)
        redirectTo: `${window.location.origin}/screens/dashboard.html`,
      },
    });

    if (error) {
      setStatus(error.message, "error");
      setBtn(googleBtn, false, "", "Continue with Google");
    }
  });
}

// Password login/signup
if (form && emailInput && passwordInput) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const mode = form.dataset.mode; // "login" | "signup"
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!isValidEmail(email)) return setStatus("Enter a valid email.", "error");
    if (!password) return setStatus("Enter your password.", "error");
    if (mode === "signup" && password.length < 8) {
      return setStatus("Password must be at least 8 characters.", "error");
    }

    const normalText = mode === "signup" ? "Create account" : "Log in";
    setBtn(submitBtn, true, mode === "signup" ? "Creating…" : "Signing in…", normalText);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });

        // If Supabase returns an error, show it
        if (error) throw error;

        /**
         * "One account per email" UX:
         * - If the email already exists, Supabase may not give a clean "duplicate" error.
         * - Also, if "Confirm email" is ON, you'll get a user but no session.
         *
         * So we show a safe message that covers both cases and prevents confusion.
         */
        if (!data.session) {
          setStatus(
            "If this email is new, your account was created. If it already exists, please log in instead.",
            "success"
          );
          // Optional: send them to login automatically:
          // window.location.href = "./login.html";
        } else {
          window.location.href = DASHBOARD_REL;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = DASHBOARD_REL;
      }
    } catch (err) {
      const msg = err?.message || "Something went wrong.";

      // Friendlier message for “wrong password / no account”
      if (/invalid login credentials/i.test(msg)) {
        setStatus("Incorrect email or password. Try again, or use Google.", "error");
      } else {
        setStatus(msg, "error");
      }
    } finally {
      setBtn(submitBtn, false, "", normalText);
    }
  });
}
