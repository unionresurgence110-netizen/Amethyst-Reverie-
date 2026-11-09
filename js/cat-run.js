
/* ==========================================
   AMETHYST PAWS — CAT RUN
   Improved Edition v3
   ========================================== */

(() => {
  "use strict";

  let state = null;

  const WIDTH = 900;
  const HEIGHT = 320;
  const GROUND = 255;

  const CAT = {
    x: 75,
    width: 48,
    height: 42
  };

  // Sound helper
  function sound(name) {
    try {
      if (window.AudioEngine?.effect) {
        window.AudioEngine.effect(name);
      }
    } catch (error) {
      console.warn("Cat Run sound error:", error);
    }
  }

  // Stop previous game
  function stop() {
    if (!state) return;

    state.stopped = true;

    if (state.frameId) {
      cancelAnimationFrame(state.frameId);
    }

    if (state.keyHandler) {
      document.removeEventListener("keydown", state.keyHandler);
    }

    state = null;
  }

  // Start game
  function start(container) {
    stop();

    if (!container) return;

    container.innerHTML = `
      <div class="catch-header">
        <div>
          <h3>🐈 Cat Run</h3>
          <p>Run through the garden and collect fish treats!</p>
        </div>
        <div class="catch-clock" id="cat-run-score">0 m</div>
      </div>

      <div class="cat-run-wrap">
        <canvas
          id="cat-run-canvas"
          width="900"
          height="320"
          aria-label="Cat running game"
        ></canvas>
      </div>

      <div class="cat-run-actions">
        <button class="button primary" id="cat-run-jump" type="button">
          ⬆ Jump
        </button>

        <button class="button secondary" id="cat-run-restart" type="button">
          ↻ Restart
        </button>
      </div>

      <p class="catch-hint" id="cat-run-hint">
        Tap Jump, press Space, or tap the game area!
      </p>

      <div class="catch-result hidden" id="cat-run-result"
        aria-live="polite"></div>
    `;

    const canvas = container.querySelector("#cat-run-canvas");
    const ctx = canvas.getContext("2d");

    state = {
      container,
      canvas,
      ctx,

      lastTime: 0,
      elapsed: 0,
      distance: 0,
      fish: 0,

      speed: 240,

      catY: GROUND - CAT.height,
      velocity: 0,

      obstacles: [],
      treats: [],

      groundOffset: 0,

      obstacleTimer: 2,
      treatTimer: 2.2,

      running: true,
      stopped: false,
      rewarded: false,
      claimed: false,

      frameId: 0,
      jump: null,
      keyHandler: null
    };

    sound("start");

    // Jump
    function jump() {
      const s = state;

      if (!s || s.stopped || !s.running) return;

      const onGround =
        s.catY >= GROUND - CAT.height - 1;

      if (onGround) {
        s.velocity = -680;
        sound("jump");
      }
    }

    state.jump = jump;

    canvas.addEventListener("pointerdown", event => {
      event.preventDefault();
      jump();
    });

    container.querySelector("#cat-run-jump")
      .addEventListener("click", jump);

    container.querySelector("#cat-run-restart")
      .addEventListener("click", () => start(container));

    // Keyboard controls
    state.keyHandler = event => {
      if (
        (event.code === "Space" || event.code === "ArrowUp") &&
        state &&
        state.running &&
        container.isConnected
      ) {
        event.preventDefault();
        jump();
      }
    };

    document.addEventListener("keydown", state.keyHandler);

    state.frameId = requestAnimationFrame(loop);
  }

  /* ==========================================
     GAME LOOP
     ========================================== */

  function loop(timestamp) {
    const s = state;

    if (
      !s ||
      s.stopped ||
      !s.running ||
      !s.container.isConnected
    ) {
      return;
    }

    const dt = Math.min(
      0.033,
      s.lastTime
        ? (timestamp - s.lastTime) / 1000
        : 0.016
    );

    s.lastTime = timestamp;
    s.elapsed += dt;

    // Gradually increase speed
    s.speed = Math.min(
      390,
      240 + s.elapsed * 3
    );

    s.distance += s.speed * dt / 20;

    s.groundOffset =
      (s.groundOffset + s.speed * dt) % 45;

    /* Obstacle spawning */

    s.obstacleTimer -= dt;

    if (s.obstacleTimer <= 0) {
      const type = Math.random();

      let height;
      let width;

      if (type < 0.30) {
        height = 30 + Math.random() * 10;
        width = 30;
      } else if (type < 0.70) {
        height = 42 + Math.random() * 12;
        width = 36;
      } else {
        height = 55 + Math.random() * 10;
        width = 42;
      }

      s.obstacles.push({
        x: WIDTH + 30,
        w: width,
        h: height
      });

      const gap = 650 + Math.random() * 180;

      s.obstacleTimer = gap / s.speed;
    }

    /* Fish spawning */

    s.treatTimer -= dt;

    if (s.treatTimer <= 0) {
      s.treats.push({
        x: WIDTH + 30,
        y: 145 + Math.random() * 35,
        taken: false
      });

      s.treatTimer = 2.3 + Math.random() * 1.2;
    }

    /* Jump physics */

    s.velocity += 1650 * dt;
    s.catY += s.velocity * dt;

    if (s.catY >= GROUND - CAT.height) {
      s.catY = GROUND - CAT.height;
      s.velocity = 0;
    }

    /* Move obstacles */

    s.obstacles.forEach(obstacle => {
      obstacle.x -= s.speed * dt;
    });

    /* Move fish */

    s.treats.forEach(fish => {
      fish.x -= s.speed * dt;

      const catCenterX = CAT.x + CAT.width / 2;
      const catCenterY = s.catY + CAT.height / 2;

      const fishCenterX = fish.x + 12;
      const fishCenterY = fish.y - 8;

      const dx = catCenterX - fishCenterX;
      const dy = catCenterY - fishCenterY;

      if (!fish.taken && Math.hypot(dx, dy) < 37) {
        fish.taken = true;
        s.fish++;
        sound("coin");
      }
    });

    s.obstacles = s.obstacles.filter(
      obstacle => obstacle.x > -70
    );

    s.treats = s.treats.filter(
      fish => fish.x > -40 && !fish.taken
    );

    /* Collision detection */

    const catBox = {
      left: CAT.x + 9,
      right: CAT.x + CAT.width - 7,
      top: s.catY + 9,
      bottom: s.catY + CAT.height - 3
    };

    const hit = s.obstacles.some(obstacle => {
      const cactusBox = {
        left: obstacle.x + 9,
        right: obstacle.x + obstacle.w - 8,
        top: GROUND - obstacle.h + 9,
        bottom: GROUND
      };

      return (
        catBox.right > cactusBox.left &&
        catBox.left < cactusBox.right &&
        catBox.bottom > cactusBox.top &&
        catBox.top < cactusBox.bottom
      );
    });

    draw(s);

    const score = s.container.querySelector(
      "#cat-run-score"
    );

    if (score) {
      score.textContent =
        `${Math.floor(s.distance)} m · 🐟 ${s.fish}`;
    }

    if (hit) {
      finish();
      return;
    }

    s.frameId = requestAnimationFrame(loop);
  }

  /* ==========================================
     DRAW CAT — RIGHT FACING
     ========================================== */

  function drawCat(ctx, x, y, elapsed, jumping) {
    ctx.save();
    ctx.translate(x, y);

    const run = jumping
      ? 0
      : Math.sin(elapsed * 17) * 3;

    // Tail
    ctx.strokeStyle = "#b38bca";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(10, 24);
    ctx.quadraticCurveTo(-8, 8 + run, 2, run);
    ctx.stroke();

    // Back legs
    ctx.fillStyle = "#b58bd1";

    ctx.beginPath();
    ctx.ellipse(16, 35 + run, 6, 9, -0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(34, 35 - run, 6, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = "#c7a2e3";

    ctx.beginPath();
    ctx.ellipse(25, 25, 21, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = "#f1dff5";

    ctx.beginPath();
    ctx.ellipse(29, 29, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#d4b2ed";

    ctx.beginPath();
    ctx.arc(39, 12, 14, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(28, 6);
    ctx.lineTo(29, -8);
    ctx.lineTo(38, 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(41, 1);
    ctx.lineTo(51, -8);
    ctx.lineTo(51, 8);
    ctx.fill();

    // Inner ears
    ctx.fillStyle = "#ecafd1";

    ctx.beginPath();
    ctx.moveTo(31, 1);
    ctx.lineTo(31, -3);
    ctx.lineTo(35, 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(45, 2);
    ctx.lineTo(49, -3);
    ctx.lineTo(48, 5);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#49344f";

    ctx.beginPath();
    ctx.arc(43, 11, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(49, 11, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = "#e98daf";

    ctx.beginPath();
    ctx.arc(47, 16, 2, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = "#80618e";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(44, 17);
    ctx.lineTo(34, 15);
    ctx.moveTo(45, 19);
    ctx.lineTo(35, 21);
    ctx.stroke();

    // Front legs
    ctx.fillStyle = "#c7a2e3";

    ctx.beginPath();
    ctx.ellipse(32, 37 - run, 5, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(43, 36 + run, 5, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* ==========================================
     DRAW CACTUS
     ========================================== */

  function drawCactus(ctx, obstacle) {
    const x = obstacle.x;
    const bottom = GROUND;
    const height = obstacle.h;

    ctx.save();

    ctx.fillStyle = "#579c75";

    // Main stem
    ctx.beginPath();
    ctx.roundRect(
      x + 10,
      bottom - height,
      15,
      height,
      7
    );
    ctx.fill();

    // Left arm
    ctx.beginPath();
    ctx.roundRect(
      x,
      bottom - height + 14,
      12,
      19,
      6
    );
    ctx.fill();

    // Right arm
    ctx.beginPath();
    ctx.roundRect(
      x + 24,
      bottom - height + 20,
      12,
      17,
      6
    );
    ctx.fill();

    // Cactus highlight
    ctx.strokeStyle = "#b7e6a6";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(x + 15, bottom - height + 8);
    ctx.lineTo(x + 15, bottom - 9);
    ctx.stroke();

    ctx.restore();
  }

  /* ==========================================
     DRAW WORLD
     ========================================== */

  function draw(s) {
    const ctx = s.ctx;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Sky
    const sky = ctx.createLinearGradient(
      0, 0, 0, HEIGHT
    );

    sky.addColorStop(0, "#d9c9f2");
    sky.addColorStop(1, "#f4e6f0");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Sun
    ctx.fillStyle = "#fff3d6";

    ctx.beginPath();
    ctx.arc(770, 75, 32, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    ctx.fillStyle = "#ffffffaa";

    for (let i = 0; i < 4; i++) {
      const x =
        (i * 260 + 130 - s.elapsed * 12) % 1050;

      ctx.beginPath();
      ctx.arc(x, 65 + i % 2 * 30, 17, 0, Math.PI * 2);
      ctx.arc(x + 19, 58 + i % 2 * 30, 22, 0, Math.PI * 2);
      ctx.arc(x + 42, 66 + i % 2 * 30, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant hills
    ctx.fillStyle = "#c5b0d5";

    ctx.beginPath();
    ctx.moveTo(0, 215);
    ctx.quadraticCurveTo(220, 125, 420, 215);
    ctx.quadraticCurveTo(650, 140, 900, 210);
    ctx.lineTo(900, 255);
    ctx.lineTo(0, 255);
    ctx.fill();

    // Ground
    ctx.fillStyle = "#b9a1d0";
    ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);

    ctx.fillStyle = "#8c6ca8";
    ctx.fillRect(0, GROUND, WIDTH, 5);

    ctx.strokeStyle = "#e9d6ef";
    ctx.lineWidth = 3;

    for (
      let x = -s.groundOffset;
      x < WIDTH;
      x += 45
    ) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND + 18);
      ctx.lineTo(x + 20, GROUND + 18);
      ctx.stroke();
    }

    // Obstacles
    s.obstacles.forEach(obstacle => {
      drawCactus(ctx, obstacle);
    });

    // Fish
    s.treats.forEach(fish => {
      ctx.font = "27px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("🐟", fish.x, fish.y);
    });

    // Cat shadow
    const jumping =
      s.catY < GROUND - CAT.height - 2;

    ctx.fillStyle = "#59436b33";

    ctx.beginPath();
    ctx.ellipse(
      CAT.x + 23,
      GROUND + 3,
      jumping ? 13 : 23,
      4,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Cat
    drawCat(
      ctx,
      CAT.x,
      s.catY,
      s.elapsed,
      jumping
    );

    // Title
    ctx.fillStyle = "#604a77";
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("AMETHYST MEADOW", 16, 25);
  }

  /* ==========================================
     GAME OVER & REWARDS
     ========================================== */

  function finish() {
    const s = state;

    if (!s || !s.running || s.rewarded) return;

    s.running = false;
    s.rewarded = true;
    s.claimed = false;

    if (s.frameId) {
      cancelAnimationFrame(s.frameId);
    }

    document.removeEventListener(
      "keydown",
      s.keyHandler
    );

    const distance = Math.floor(s.distance);

    const coins = Math.max(
      3,
      Math.floor(distance / 8) + s.fish * 2
    );

    const xp = Math.max(
      2,
      Math.floor(distance / 12) + s.fish
    );

    const result = s.container.querySelector(
      "#cat-run-result"
    );

    if (!result) return;

    result.classList.remove("hidden");

    result.innerHTML = `
      <div class="catch-result-icon">🐾</div>

      <h3>Run complete!</h3>

      <p>
        You dashed <b>${distance} m</b>
        and collected <b>${s.fish}</b> fish treats.
      </p>

      <div class="catch-rewards">
        <span>🪙 +${coins} coins</span>
        <span>✦ +${xp} XP</span>
      </div>

      <button type="button" class="button primary"
        id="cat-run-collect">
        Collect Rewards 🎁
      </button>
    `;

    const collectButton = result.querySelector(
      "#cat-run-collect"
    );

    collectButton.addEventListener("click", () => {
      if (s.claimed) return;

      // Access the existing global Game binding
      if (
        typeof Game === "undefined" ||
        typeof Game.reward !== "function"
      ) {
        console.error(
          "Cat Run: Game.reward is unavailable."
        );

        collectButton.textContent =
          "Reward system unavailable";

        return;
      }

      s.claimed = true;

      try {
        Game.reward(coins, xp);

        if (typeof Game.gamePlayed === "function") {
          Game.gamePlayed();
        }
      } catch (error) {
        s.claimed = false;

        console.error("Cat Run reward error:", error);

        collectButton.textContent =
          "Reward failed - try again";

        return;
      }

      sound("coin");

      collectButton.textContent =
        "Rewards Collected ✓";

      collectButton.disabled = true;

      // Notify the main app to refresh its UI
      window.dispatchEvent(
        new CustomEvent("amethyst:catrun-finished")
      );

      result.insertAdjacentHTML(
        "beforeend",
        `
          <button type="button" class="button secondary"
            id="cat-run-play-again">
            Run again ↻
          </button>
        `
      );

      result.querySelector("#cat-run-play-again")
        .addEventListener("click", () => {
          start(s.container);
        });
    });

    const hint = s.container.querySelector(
      "#cat-run-hint"
    );

    if (hint) {
      hint.textContent =
        "Collect your rewards before your next run!";
    }

    sound("gameover");
  }

  // Public game controls
  window.CatRun = {
    start,
    stop
  };

})();
