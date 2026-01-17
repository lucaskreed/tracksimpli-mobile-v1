const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");

if (form && emailInput) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      emailInput.focus();
      return;
    }

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);

    window.location.href = "../screens/dashboard.html";
  });
}
