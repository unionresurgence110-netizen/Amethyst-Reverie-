/* Amethyst Paws — reusable custom dialogs and notifications */
(() => {
  "use strict";
  if (window.APDialogs) return;

  const toastEl = () => document.getElementById("toast");
  let toastTimer = null;
  let activeDialog = null;

  function toast(message, type = "success", duration = 2600) {
    const el = toastEl();
    if (!el) return;
    el.textContent = String(message);
    el.className = `toast show ${type}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), duration);
  }

  function closeDialog(value) {
    if (!activeDialog) return;
    const { overlay, resolve, keyHandler } = activeDialog;
    document.removeEventListener("keydown", keyHandler);
    overlay.remove();
    activeDialog = null;
    resolve(value);
  }

  function dialog({ title, message, input = false, placeholder = "", initialValue = "", confirmText = "Continue", cancelText = "Cancel", danger = false, required = false }) {
    if (activeDialog) closeDialog(null);
    return new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.className = "ap-dialog-backdrop";
      overlay.innerHTML = `
        <section class="ap-dialog" role="dialog" aria-modal="true" aria-labelledby="ap-dialog-title" aria-describedby="ap-dialog-message">
          <div class="ap-dialog-mark" aria-hidden="true">✦</div>
          <h2 id="ap-dialog-title"></h2>
          <p id="ap-dialog-message"></p>
          ${input ? `<label class="ap-dialog-label" for="ap-dialog-input">Your answer</label><input id="ap-dialog-input" class="ap-dialog-input" type="text" maxlength="120" autocomplete="off">` : ""}
          <div class="ap-dialog-actions">
            <button type="button" class="ap-dialog-cancel"></button>
            <button type="button" class="ap-dialog-confirm"></button>
          </div>
        </section>`;
      const titleEl = overlay.querySelector("#ap-dialog-title");
      const messageEl = overlay.querySelector("#ap-dialog-message");
      titleEl.textContent = title;
      messageEl.textContent = message;
      const cancel = overlay.querySelector(".ap-dialog-cancel");
      const accept = overlay.querySelector(".ap-dialog-confirm");
      cancel.textContent = cancelText;
      accept.textContent = confirmText;
      if (danger) accept.classList.add("danger");
      const field = overlay.querySelector("#ap-dialog-input");
      if (field) {
        field.placeholder = placeholder;
        field.value = initialValue;
        field.required = required;
      }
      cancel.addEventListener("click", () => closeDialog(null));
      accept.addEventListener("click", () => {
        if (field && required && !field.value.trim()) {
          field.focus();
          field.setAttribute("aria-invalid", "true");
          return;
        }
        closeDialog(field ? field.value.trim() : true);
      });
      overlay.addEventListener("pointerdown", event => {
        if (event.target === overlay) closeDialog(null);
      });
      const keyHandler = event => {
        if (event.key === "Escape") { event.preventDefault(); closeDialog(null); }
        if (event.key === "Enter" && (!field || document.activeElement === field)) {
          event.preventDefault(); accept.click();
        }
        if (event.key === "Tab") {
          const focusable = [...overlay.querySelectorAll("button,input")];
          if (event.shiftKey && document.activeElement === focusable[0]) {
            event.preventDefault(); focusable[focusable.length - 1].focus();
          } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
            event.preventDefault(); focusable[0].focus();
          }
        }
      };
      document.body.appendChild(overlay);
      activeDialog = { overlay, resolve, keyHandler };
      document.addEventListener("keydown", keyHandler);
      (field || accept).focus();
    });
  }

  window.APDialogs = {
    toast,
    success: message => toast(message, "success"),
    error: message => toast(message, "error", 3400),
    confirm: (message, options = {}) => dialog({
      title: options.title || "A little check-in",
      message,
      confirmText: options.confirmText || "Yes, continue",
      cancelText: options.cancelText || "Keep it",
      danger: !!options.danger
    }).then(value => value === true),
    prompt: (message, options = {}) => dialog({
      title: options.title || "One little thing",
      message,
      input: true,
      placeholder: options.placeholder || "Type here…",
      initialValue: options.initialValue || "",
      required: !!options.required,
      confirmText: options.confirmText || "Save",
      cancelText: options.cancelText || "Cancel"
    })
  };
})();
