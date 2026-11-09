/* Amethyst Paws — Cozy Home Decoration System */
(() => {
  "use strict";

  const catalog = [
    { name: "Moon cushion", icon: "🌙", desc: "A soft place to nap.", price: 45 },
    { name: "Star lamp", icon: "⭐", desc: "A little glow for your room.", price: 60 },
    { name: "Tiny plant", icon: "🪴", desc: "A touch of green magic.", price: 35 },
    { name: "Cloud sofa", icon: "🛋️", desc: "A dreamy spot to lounge.", price: 75 },
    { name: "Lilac cat bed", icon: "🛏️", desc: "A snug nest for sleepy paws.", price: 65 },
    { name: "Flower pot", icon: "🌷", desc: "A little bloom for your home.", price: 30 },
    { name: "Moon wall art", icon: "🖼️", desc: "A tiny piece of moonlit magic.", price: 40 },
    { name: "Teddy friend", icon: "🧸", desc: "A soft friend for your cat.", price: 50 },
    { name: "Fish pillow", icon: "🐟", desc: "A playful cushion.", price: 32 },
    { name: "Crystal floor lamp", icon: "💡", desc: "Warm amethyst light.", price: 55 }
  ];

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, Number(value) || min));

  const escapeHTML = value =>
    String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const getGameData = () => {
    if (typeof Game === "undefined") return null;
    return Game.get();
  };

  function getIcon(name) {
    return catalog.find(item => item.name === name)?.icon || "✨";
  }

  function getInventory() {
    const data = getGameData();
    if (!data) return [];

    const owned = Array.isArray(data.items) ? data.items : [];
    const placed = Array.isArray(data.roomItems) ? data.roomItems : [];
    const counts = {};

    owned.forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });

    placed.forEach(item => {
      if (item?.name && counts[item.name]) counts[item.name]--;
    });

    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        icon: getIcon(name)
      }));
  }

  function render() {
    const room = document.getElementById("home-scene");
    const inventory = document.getElementById("decoration-list");

    if (!room || !inventory || typeof Game === "undefined") return;

    const data = getGameData();
    if (!data) return;

    if (!Array.isArray(data.roomItems)) data.roomItems = [];
    if (!Array.isArray(data.items)) data.items = [];

    const placed = data.roomItems;
    const available = getInventory();

room.innerHTML = `
  <div class="empty-room-wall">
    <div class="empty-room-light"></div>
  </div>

  <div class="empty-room-floor"></div>

  <div class="cozy-room-items" id="cozy-room-items">
    ${placed.map((item, index) => `
      <button
        type="button"
        class="cozy-placed-item"
        data-room-index="${index}"
        aria-label="Select ${escapeHTML(item.name)}"
        aria-pressed="false"
        style="
          left:${clamp(item.x, 4, 96)}%;
          top:${clamp(item.y, 8, 94)}%;
          touch-action:none;
        "
      >${getIcon(item.name)}</button>
    `).join("")}
  </div>

  <div class="empty-room-hint">
    ✦ Your little world, your own design ✦
  </div>
`;
    inventory.innerHTML = `
      <div class="cozy-inventory-head">
        <div>
          <b>Furniture inventory</b>
          <small>Only furniture you own can be placed.</small>
        </div>
        <span>${available.reduce((total, item) => total + item.count, 0)} available</span>
      </div>

      ${
        available.length
          ? `
            <div class="cozy-inventory-grid">
              ${available.map(item => `
                <button
                  type="button"
                  class="cozy-inventory-item"
                  data-place="${escapeHTML(item.name)}"
                >
                  <span>${item.icon}</span>
                  <b>${escapeHTML(item.name)}</b>
                  <small>×${item.count} · Place</small>
                </button>
              `).join("")}
            </div>
          `
          : `
            <p class="cozy-empty">
              Your furniture shelf is waiting for its first treasure.
              Visit the little shop to find decorations!
            </p>
          `
      }

      <div class="cozy-selection-bar">
        <span id="cozy-selected-label">
          Select a piece in your room to move or remove it.
        </span>
        <button type="button" id="cozy-remove" disabled>
          Remove selected
        </button>
      </div>

      <div class="cozy-shop-divider"></div>

      <div class="cozy-inventory-head cozy-decor-shop-head">
        <div>
          <b>✨ Little decoration shop</b>
          <small>Find a new treasure for your cozy home.</small>
        </div>
      </div>

      <div class="cozy-inventory-grid">
        ${catalog.map(item => {
          const owned = data.items.filter(
            name => name === item.name
          ).length;

          const alreadyPlaced = placed.filter(
            piece => piece.name === item.name
          ).length;

          const canPlace = owned > alreadyPlaced;

          return `
            <div class="cozy-inventory-item cozy-shop-item">
              <span>${item.icon}</span>
              <b>${escapeHTML(item.name)}</b>
              <small>${escapeHTML(item.desc)}</small>
              <small class="cozy-owned-count">
                ${owned ? `Owned: ×${owned}` : `${item.price} coins`}
              </small>

              <button
                type="button"
                data-decor-buy="${escapeHTML(item.name)}"
                ${owned ? "disabled" : ""}
              >
                ${owned ? "Already owned" : `Buy · ${item.price} ✦`}
              </button>

              ${canPlace ? `<small>Ready to place above ↑</small>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    `;

    setupPlacement(room, inventory);
    setupDecorationShop(inventory);
    setupDragging(room, inventory, placed);
  }

  function setupDecorationShop(inventory) {
    inventory.querySelectorAll("[data-decor-buy]").forEach(button => {
      button.addEventListener("click", () => {
        const item = catalog.find(
          entry => entry.name === button.dataset.decorBuy
        );

        if (!item) return;

        if (!Game.buy(item.name, item.price, "decor")) {
          window.APDialogs?.error(
            "Not enough coins for this decoration. Try an activity to earn more!"
          );
          return;
        }

        render();

        const wallet = document.getElementById("coin-count");
        if (wallet) wallet.textContent = Game.get().coins;

        window.APDialogs?.success(
          `${item.name} added to your furniture inventory! Tap Place to add it to your room.`
        );
      });
    });
  }

  function setupPlacement(room, inventory) {
    inventory.querySelectorAll("[data-place]").forEach(button => {
      button.addEventListener("click", () => {
        const name = button.dataset.place;

        const x = clamp(45 + Math.random() * 10, 4, 96);
        const y = clamp(65 + Math.random() * 12, 8, 94);

        if (!Game.placeDecoration(name, x, y)) {
          window.APDialogs?.error(
            "This decoration is not available in your inventory."
          );
          return;
        }

        render();

        window.APDialogs?.success(
          `${name} has found a cozy spot!`
        );
      });
    });
  }

  function setupDragging(room, inventory, placed) {
    const label = inventory.querySelector("#cozy-selected-label");
    const removeButton = inventory.querySelector("#cozy-remove");

    const nodes = [
      ...room.querySelectorAll("[data-room-index]")
    ];

    let selectedIndex = -1;

    function selectItem(node, index) {
      nodes.forEach(item => {
        item.classList.remove("selected");
        item.setAttribute("aria-pressed", "false");
      });

      selectedIndex = index;

      node.classList.add("selected");
      node.setAttribute("aria-pressed", "true");

      const item = placed[index];

      label.textContent = item
        ? `${item.name} selected · Drag to move it.`
        : "Select a decoration.";

      removeButton.disabled = !item;
    }

    nodes.forEach(node => {
      let pointerId = null;
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let originalX = 0;
      let originalY = 0;

      const index = Number(node.dataset.roomIndex);

      node.addEventListener("click", () => {
        if (!dragging) selectItem(node, index);
      });

      node.addEventListener("pointerdown", event => {
        if (event.button !== undefined && event.button !== 0) return;

        event.preventDefault();

        const item = placed[index];
        if (!item) return;

        selectItem(node, index);

        pointerId = event.pointerId;
        dragging = false;

        startX = event.clientX;
        startY = event.clientY;

        originalX = clamp(item.x, 4, 96);
        originalY = clamp(item.y, 8, 94);

        node.setPointerCapture(pointerId);
      });

      node.addEventListener("pointermove", event => {
        if (pointerId !== event.pointerId) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (!dragging && Math.hypot(dx, dy) > 4) {
          dragging = true;
          node.classList.add("dragging");
        }

        if (!dragging) return;

        const rect = room.getBoundingClientRect();

        const x = clamp(
          originalX + (dx / rect.width) * 100,
          4,
          96
        );

        const y = clamp(
          originalY + (dy / rect.height) * 100,
          8,
          94
        );

        node.style.left = `${x}%`;
        node.style.top = `${y}%`;

        if (placed[index]) {
          placed[index].x = x;
          placed[index].y = y;
        }
      });

      function finishDrag(event) {
        if (pointerId !== event.pointerId) return;

        pointerId = null;
        node.classList.remove("dragging");

        if (dragging) {
          dragging = false;
          Game.save();
        }
      }

      node.addEventListener("pointerup", finishDrag);
      node.addEventListener("pointercancel", finishDrag);
      node.addEventListener("lostpointercapture", finishDrag);
    });

    removeButton.addEventListener("click", () => {
      if (selectedIndex < 0) return;

      if (!Game.removeDecoration(selectedIndex)) {
        window.APDialogs?.error(
          "Could not remove this decoration."
        );
        return;
      }

      render();

      window.APDialogs?.success(
        "Decoration returned to your furniture inventory!"
      );
    });
  }

  window.CozyHome = {
    catalog,
    render
  };
})();