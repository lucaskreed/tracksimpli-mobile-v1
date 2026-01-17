import { supabase } from "./supabase.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");

if (form && emailInput) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      emailInput.focus();
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          window.location.origin + "/screens/dashboard.html"
      }
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for the login link.");
    }
  });
}
