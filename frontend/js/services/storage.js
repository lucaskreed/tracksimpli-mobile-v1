export function saveSession(session) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.unshift(session);
  localStorage.setItem("history", JSON.stringify(history.slice(0, 50)));
}
