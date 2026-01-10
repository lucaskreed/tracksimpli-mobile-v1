export function $(id){ return document.getElementById(id); }

export function setBadge(text){
  $("badge").textContent = text;
}

export function toggleDrawer(){
  $("drawer").classList.toggle("open");
}

export function showModal(title, bodyHTML, buttonsHTML){
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = bodyHTML;
  $("modalBtns").innerHTML = buttonsHTML;
  $("modalWrap").classList.add("show");
}

export function closeModal(){
  $("modalWrap").classList.remove("show");
}

export function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
