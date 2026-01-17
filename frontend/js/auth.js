const emailInput = document.getElementById("email");
const continueBtn = document.getElementById("continueBtn");

if (continueBtn && emailInput) {
  continueBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();

    if (!email) {
      emailInput.focus();
      return;
    }

    console.log("Continue with email:", email);
    // next step: send magic link OR show password screen
  });
}
