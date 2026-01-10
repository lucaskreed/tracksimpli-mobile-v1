let modalEl;

export function showModal(title, contentHTML, actions = []) {
  if (!modalEl) createModal();

  modalEl.querySelector(".modal-title").textContent = title;
  modalEl.querySelector(".modal-body").innerHTML = contentHTML;

  const actionsEl = modalEl.querySelector(".modal-actions");
  actionsEl.innerHTML = "";

  actions.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a.label;
    btn.className = `btn ${a.type || "secondary"}`;
    btn.onclick = () => {
      if (a.onClick) a.onClick();
      hideModal();
    };
    actionsEl.appendChild(btn);
  });

  modalEl.classList.remove("hidden");
}

export function hideModal() {
  if (modalEl) modalEl.classList.add("hidden");
}

function createModal() {
  modalEl = document.createElement("div");
  modalEl.className = "modal hidden";
  modalEl.innerHTML = `
    <div class="modal-card">
      <div class="modal-title"></div>
      <div class="modal-body"></div>
      <div class="modal-actions"></div>
    </div>
  `;
  document.body.appendChild(modalEl);
}
