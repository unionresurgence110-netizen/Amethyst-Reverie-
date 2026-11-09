/* Amethyst Paws — six-window Catch the Cats mini-game */
(() => {
  "use strict";

  const cats = [
    { id:"mochi", name:"Mochi", icon:"🐱" },
    { id:"luna", name:"Luna", icon:"🐈" },
    { id:"mittens", name:"Mittens", icon:"😺" },
    { id:"cocoa", name:"Cocoa", icon:"🐈‍⬛" },
    { id:"peaches", name:"Peaches", icon:"😸" },
    { id:"miso", name:"Miso", icon:"😽" },
    { id:"berry", name:"Berry", icon:"😻" },
    { id:"cloud", name:"Cloud", icon:"🐈" },
    { id:"pudding", name:"Pudding", icon:"😹" },
    { id:"fig", name:"Fig", icon:"🐱" },
    { id:"taro", name:"Taro", icon:"😼" },
    { id:"sprout", name:"Sprout", icon:"😸" }
  ];

  let state = null;

  function clearTimers(s) {
    if (!s) return;

    if (s.spawnTimer) clearTimeout(s.spawnTimer);
    if (s.hideTimer) clearTimeout(s.hideTimer);
    if (s.clockTimer) clearInterval(s.clockTimer);

    s.spawnTimer = s.hideTimer = s.clockTimer = null;
  }

  function stop() {
    if (!state) return;

    state.stopped = true;
    clearTimers(state);

    state.container?.querySelectorAll("[data-window]").forEach(room => {
      room.classList.remove("cat-visible", "catch-burst");

      const catEl = room.querySelector(".room-window-cat");

      if (catEl) {
        catEl.classList.remove(
          "peeking",
          "golden",
          "caught-pop"
        );

        catEl.textContent = "";
      }
    });

    state = null;
  }

  function start(container) {
    stop();

    if (!container) return;

    const s = state = {
      container,
      seconds: 30,
      score: 0,
      caught: [],
      caughtIds: new Set(),
      misses: 0,
      goldenCaught: 0,
      activeWindow: -1,
      activeCat: null,
      spawnTimer: null,
      hideTimer: null,
      clockTimer: null,
      stopped: false,
      finished: false,
      rewarded: false,
      roundId: Math.random().toString(36).slice(2)
    };

    container.innerHTML = `
      <div class="catch-header">
        <div>
          <h3>🏠 Catch the Cats</h3>
          <p>Peek-a-boo! Tap the window with a kitty before they hide.</p>
        </div>
        <div class="catch-clock" id="catch-clock">30s</div>
      </div>

      <div class="catch-stats">
        <span>🐾 Caught <b id="catch-score">0</b></span>
        <span>🌟 Golden <b id="catch-golden">0</b></span>
        <span>Best <b id="catch-best">${Game.get().bestCatchCats || 0}</b></span>
      </div>

      <div class="dollhouse-wrap">
        <div class="dollhouse-roof">
          <span>✦</span>
          <b>AMETHYST COTTAGE</b>
          <span>✦</span>
        </div>

        <div class="dollhouse" id="dollhouse">
          ${Array.from({ length: 3 }, (_, floor) => `
            <div class="doll-floor floor-${floor + 1}">
              ${Array.from({ length: 2 }, (_, room) => {
                const n = floor * 2 + room;

                return `
                  <button
                    class="doll-room"
                    type="button"
                    data-window="${n}"
                    aria-label="Check ${floor === 0 ? "top" : floor === 1 ? "middle" : "ground"} floor ${room === 0 ? "left" : "right"} room"
                  >
                    <span class="room-ceiling-light">✧</span>

                    <span class="room-wall-art">
                      ${["🌙", "🖼️", "⭐", "🌷", "💜", "🪴"][n]}
                    </span>

                    <span class="room-window-frame">
                      <span class="room-window-sky">☾　✦</span>
                      <span class="room-window-cat" aria-hidden="true"></span>
                    </span>

                    <span class="room-furniture">
                      ${[
                        "🛋️　🪴",
                        "🛏️　🧸",
                        "📚　🪑",
                        "🪴　🛋️",
                        "🧺　🧸",
                        "🛏️　🌷"
                      ][n]}
                    </span>

                    <span class="room-floor-rug"></span>

                    <span class="room-name">
                      ${[
                        "Moon Lounge",
                        "Dream Bedroom",
                        "Star Library",
                        "Flower Nook",
                        "Cozy Parlor",
                        "Kitten Suite"
                      ][n]}
                    </span>
                  </button>
                `;
              }).join("")}
            </div>
          `).join("")}
        </div>
      </div>

      <p class="catch-hint" id="catch-hint">
        Watch all six windows — a kitty could peek out anywhere!
      </p>

      <div class="catch-result hidden" id="catch-result" aria-live="polite"></div>
    `;

    container.querySelectorAll("[data-window]").forEach(button => {
      button.addEventListener("click", () => {
        catchWindow(Number(button.dataset.window), s);
      });
    });

    s.clockTimer = setInterval(() => {
      if (state !== s || s.stopped || s.finished) return;

      s.seconds = Math.max(0, s.seconds - 1);

      const clock = container.querySelector("#catch-clock");

      if (clock) {
        clock.textContent = `${s.seconds}s`;
      }

      if (s.seconds <= 0) {
        finish(s);
      }
    }, 1000);

    scheduleSpawn(s, 500);
  }

  function scheduleSpawn(s, delay) {
    if (
      state !== s ||
      s.stopped ||
      s.finished ||
      s.activeCat
    ) return;

    clearTimeout(s.spawnTimer);

    s.spawnTimer = setTimeout(() => {
      spawnCat(s);
    }, delay);
  }

  function spawnCat(s) {
    if (
      state !== s ||
      s.stopped ||
      s.finished ||
      s.activeCat
    ) return;

    const remaining = cats.filter(
      cat => !s.caughtIds.has(cat.id)
    );

    if (!remaining.length) {
      const hint = s.container.querySelector("#catch-hint");

      if (hint) {
        hint.textContent =
          "You found every kitty! Enjoy the last moments of the round.";
      }

      return;
    }

    const windowIndex = Math.floor(Math.random() * 6);

    const cat = remaining[
      Math.floor(Math.random() * remaining.length)
    ];

    const golden = Math.random() < 0.075;

    s.activeWindow = windowIndex;

    s.activeCat = {
      ...cat,
      golden,
      caught: false
    };

    const room = s.container.querySelector(
      `[data-window="${windowIndex}"]`
    );

    if (!room) {
      s.activeWindow = -1;
      s.activeCat = null;
      scheduleSpawn(s, 350);
      return;
    }

    const catEl = room.querySelector(".room-window-cat");

    catEl.textContent = golden ? "🐈✨" : cat.icon;
    catEl.classList.toggle("golden", golden);

    // Force the peek animation to restart for every appearance.
    catEl.classList.remove("peeking");

    void catEl.offsetWidth;

    catEl.classList.add("peeking");
    room.classList.add("cat-visible");

    const hint = s.container.querySelector("#catch-hint");

    if (hint) {
      hint.textContent = golden
        ? "A rare golden kitty! Catch it for bonus points!"
        : "A kitty is peeking out — tap its window!";
    }

    const duration =
      Math.max(1050, 2050 - s.score * 28) +
      Math.random() * 400;

    s.hideTimer = setTimeout(() => {
      hideCat(s, true);
    }, duration);
  }

  function clearActiveWindow(s) {
    if (!s || s.activeWindow < 0) {
      if (s) s.activeCat = null;
      return;
    }

    const room = s.container.querySelector(
      `[data-window="${s.activeWindow}"]`
    );

    if (room) {
      const catEl = room.querySelector(".room-window-cat");

      if (catEl) {
        catEl.classList.remove(
          "peeking",
          "golden",
          "caught-pop"
        );

        catEl.textContent = "";
      }

      room.classList.remove("cat-visible");
    }

    s.activeWindow = -1;
    s.activeCat = null;
  }

  function hideCat(s, missed) {
    if (
      state !== s ||
      s.stopped ||
      s.finished ||
      !s.activeCat
    ) return;

    if (missed) s.misses++;

    clearTimeout(s.hideTimer);
    s.hideTimer = null;

    clearActiveWindow(s);

    const hint = s.container.querySelector("#catch-hint");

    if (hint && missed) {
      hint.textContent =
        "Oops, the kitty slipped away. Another one may peek out soon!";
    }

    const nextDelay =
      Math.max(320, 720 - s.score * 12) +
      Math.random() * 300;

    scheduleSpawn(s, nextDelay);
  }

  function catchWindow(index, s) {
    if (
      state !== s ||
      s.stopped ||
      s.finished ||
      !s.activeCat ||
      s.activeWindow !== index ||
      s.activeCat.caught
    ) return;

    clearTimeout(s.hideTimer);
    s.hideTimer = null;

    const cat = s.activeCat;

    cat.caught = true;

    s.caughtIds.add(cat.id);

    s.caught.push({
      id: cat.id,
      name: cat.name,
      golden: cat.golden
    });

    s.score += cat.golden ? 5 : 1;

    if (cat.golden) {
      s.goldenCaught++;
    }

    const room = s.container.querySelector(
      `[data-window="${index}"]`
    );

    if (room) {
      room.classList.add("catch-burst");
    }

    if (window.AudioEngine) {
      AudioEngine.effect(cat.golden ? "success" : "pop");
    }

    updateStats(s);

    const hint = s.container.querySelector("#catch-hint");

    if (hint) {
      hint.textContent = cat.golden
        ? "Golden kitty caught! +5 points! ✨"
        : `${cat.name} says meow! +1 point`;
    }

    clearActiveWindow(s);

    scheduleSpawn(
      s,
      Math.max(350, 650 - s.score * 10) +
      Math.random() * 260
    );
  }

  function updateStats(s) {
    const score = s.container.querySelector("#catch-score");
    const golden = s.container.querySelector("#catch-golden");

    if (score) score.textContent = s.score;
    if (golden) golden.textContent = s.goldenCaught;
  }

  function finish(s) {
    if (
      state !== s ||
      s.finished ||
      s.rewarded
    ) return;

    s.finished = true;

    clearTimers(s);
    clearActiveWindow(s);

    s.rewarded = true;

    const caughtCount = s.caught.length;

    const coins =
      caughtCount * 3 +
      s.goldenCaught * 5;

    const xp =
      caughtCount * 2 +
      s.goldenCaught * 3;

    Game.reward(coins, xp);
    Game.gamePlayed();

    const best = Game.recordCatchCatsBest(s.score);

    const result = s.container.querySelector("#catch-result");

    result.classList.remove("hidden");

    const caughtNames = s.caught.map(cat =>
      `${cat.golden ? "✨" : "🐾"} ${cat.name}`
    ).join(" · ") ||
      "No cats caught this time — the kitties were extra sneaky!";

    result.innerHTML = `
      <div class="catch-result-icon">
        ${s.score >= 15 ? "🏆" : "💜"}
      </div>

      <h3>What a lovely hunt!</h3>

      <p>
        You caught <b>${caughtCount}</b> cats and missed
        <b>${s.misses}</b>. Golden cats:
        <b>${s.goldenCaught}</b>.
      </p>

      <p class="catch-caught-list">${caughtNames}</p>

      <div class="catch-result-score">
        ${s.score} <small>points</small>
      </div>

      <div class="catch-rewards">
        <span>🪙 +${coins} coins</span>
        <span>✦ +${xp} XP</span>
      </div>

      <p class="catch-best-line">Best score: ${best}</p>

      <button
        type="button"
        class="button primary"
        id="catch-replay"
      >
        Play again ↻
      </button>
    `;

    result.querySelector("#catch-replay").addEventListener(
      "click",
      () => start(s.container)
    );

    const hint = s.container.querySelector("#catch-hint");

    if (hint) {
      hint.textContent =
        "The dollhouse is quiet again. Lovely catching!";
    }

    if (window.AudioEngine) {
      AudioEngine.effect("success");
    }

    window.dispatchEvent(
      new CustomEvent("amethyst:catchcats-finished")
    );
  }

  window.CatchCats = { start, stop };

})();

// COMPLETE CODE — END OF js/catch-cats.js