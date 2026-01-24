import { supabase } from "./supabase.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const submitBtn = form?.querySelector('button[type="submit"]');

let sending = false;

if (form && emailInput) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;

    const email = emailInput.value.trim();
    if (!email) return emailInput.focus();

    try {
      sending = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/frontend/screens/dashboard.html`,
        },
      });

      if (error) alert(error.message);
      else alert("Check your email for the login link.");
    } finally {
      sending = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Continue with email";
      }
    }
  });
}
