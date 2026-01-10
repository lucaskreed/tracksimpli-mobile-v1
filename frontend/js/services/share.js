export function shareText(text) {
  if (navigator.share) {
    navigator.share({ text });
  } else {
    navigator.clipboard.writeText(text);
    alert("Link copied");
  }
}
