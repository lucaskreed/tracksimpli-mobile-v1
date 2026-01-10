function init_test() {
  // Temporary fake result so navigation + flow works
  setTimeout(() => {
    const session = {
      reps: Math.floor(Math.random() * 20) + 10,
      quality: Math.floor(Math.random() * 20) + 80,
      date: new Date().toISOString().slice(0, 10)
    };

    localStorage.setItem("last_session", JSON.stringify(session));

    navigate("dashboard");
  }, 1500);
}
