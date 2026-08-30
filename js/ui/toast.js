/**
 * toast.js — notificações efêmeras + modal simples.
 */

export function toast(message, kind = "", ms = 2600) {
  const wrap = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast${kind ? ` toast--${kind}` : ""}`;
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add("is-out");
    setTimeout(() => el.remove(), 320);
  }, ms);
}

/**
 * Modal. content pode ser string HTML ou HTMLElement.
 * Retorna uma função close().
 */
export function modal(content, { onClose } = {}) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  const box = document.createElement("div");
  box.className = "modal";
  if (typeof content === "string") box.innerHTML = content;
  else box.appendChild(content);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
    onClose?.();
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", onKey);

  return { close, box };
}
