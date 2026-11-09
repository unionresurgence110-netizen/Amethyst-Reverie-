const Game = (() => {
  const KEY = "amethystPawsSave_v1";

  const defaults = () => ({
    cat: null,
    coins: 60,
    crystals: 0,
    xp: 0,
    level: 1,
    hunger: 80,
    happiness: 85,
    energy: 90,
    items: ["Cozy starter bed"],
    decorations: [],
    roomItems: [],
    bestCatchCats: 0,
    gamesPlayed: 0,
    pets: 0,
    feeds: 0,
    adopted: false,
    createdAt: Date.now()
  });

  let data = defaults();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        data = { ...defaults(), ...parsed };

        if (!Array.isArray(data.roomItems)) {
          data.roomItems = [];
        }

        if (!Array.isArray(data.items)) {
          data.items = [];
        }

        // Migrate older decoration saves into movable room pieces.
        if (
          data.roomItems.length === 0 &&
          Array.isArray(data.decorations) &&
          data.decorations.length
        ) {
          data.roomItems = data.decorations.map((name, index) => ({
            name,
            x: 22 + (index % 4) * 18,
            y: 68 + Math.floor(index / 4) * 10
          }));
        }

        // Ensure every placed item has a matching owned inventory entry.
        const placedCounts = {};

        data.roomItems.forEach(item => {
          if (item && item.name) {
            placedCounts[item.name] =
              (placedCounts[item.name] || 0) + 1;
          }
        });

        Object.entries(placedCounts).forEach(([name, count]) => {
          while (
            data.items.filter(item => item === name).length < count
          ) {
            data.items.push(name);
          }
        });

        if (Array.isArray(data.decorations)) {
          data.decorations.forEach(name => {
            if (name && !data.items.includes(name)) {
              data.items.push(name);
            }
          });
        }

        if (!Number.isFinite(data.bestCatchCats)) {
          data.bestCatchCats = 0;
        }

        save();
      }
    } catch (e) {
      console.warn("Save could not be read", e);
      data = defaults();
    }

    return data;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn("Save could not be written", e);
      return false;
    }
  }

  function get() {
    return data;
  }

  function reset() {
    data = defaults();
    save();
    return data;
  }

  function adopt(cat, name) {
    data.cat = cat;
    data.catName = (name || "Mochi").trim().slice(0, 16) || "Mochi";
    data.adopted = true;
    save();
  }

  function reward(coins = 0, xp = 0) {
    data.coins += coins;
    data.xp += xp;

    let leveled = false;

    while (data.xp >= data.level * 100) {
      data.xp -= data.level * 100;
      data.level++;
      leveled = true;
    }

    save();
    return { leveled };
  }

  function spend(amount) {
    if (data.coins < amount) return false;

    data.coins -= amount;
    save();

    return true;
  }

  function pet() {
    data.happiness = Math.min(100, data.happiness + 9);
    data.energy = Math.max(0, data.energy - 2);
    data.pets++;

    reward(1, 3);
    save();
  }

  function feed() {
    if (!spend(10)) return false;

    data.hunger = Math.min(100, data.hunger + 25);
    data.happiness = Math.min(100, data.happiness + 3);
    data.feeds++;

    save();
    return true;
  }

  function play() {
    if (data.energy < 12) return false;

    data.energy = Math.max(0, data.energy - 12);
    data.happiness = Math.min(100, data.happiness + 18);
    data.hunger = Math.max(0, data.hunger - 5);

    reward(3, 8);
    save();

    return true;
  }

  function buy(name, cost, kind) {
    if (!spend(cost)) return false;

    if (kind === "food") {
      data.hunger = Math.min(100, data.hunger + 40);
    } else {
      data.items.push(name);

      if (kind === "toy") {
        data.happiness = Math.min(100, data.happiness + 10);
      }
    }

    save();

    window.dispatchEvent(
      new CustomEvent("amethyst:inventory-changed", {
        detail: { name, kind }
      })
    );

    return true;
  }

  function decorate(item) {
    return placeDecoration(item, 50, 70);
  }

  function placeDecoration(name, x = 50, y = 70) {
    if (!data.items.includes(name)) return false;

    const owned = data.items.filter(item => item === name).length;

    const placed = data.roomItems.filter(
      item => item.name === name
    ).length;

    if (placed >= owned) return false;

    data.roomItems.push({
      name,
      x: Math.max(4, Math.min(96, Number(x) || 50)),
      y: Math.max(8, Math.min(94, Number(y) || 70))
    });

    if (!data.decorations.includes(name)) {
      data.decorations.push(name);
    }

    save();
    return true;
  }

  function moveDecoration(index, x, y) {
    const item = data.roomItems[index];

    if (!item) return false;

    item.x = Math.max(4, Math.min(96, Number(x) || item.x));
    item.y = Math.max(8, Math.min(94, Number(y) || item.y));

    save();
    return true;
  }

  function removeDecoration(index) {
    if (!data.roomItems[index]) return false;

    data.roomItems.splice(index, 1);

    save();
    return true;
  }

  function recordCatchCatsBest(score) {
    data.bestCatchCats = Math.max(
      data.bestCatchCats || 0,
      Math.max(0, Number(score) || 0)
    );

    save();
    return data.bestCatchCats;
  }

  function gamePlayed() {
    data.gamesPlayed++;
    save();
  }

  function tick() {
    if (!data.adopted) return;

    data.hunger = Math.max(0, data.hunger - 0.18);
    data.happiness = Math.max(0, data.happiness - 0.08);
    data.energy = Math.min(100, data.energy + 0.05);

    save();
  }

  function achievements() {
    return [
      {
        id: "adopt",
        icon: "🐱",
        name: "A New Beginning",
        desc: "Adopt your first companion.",
        done: !!data.adopted
      },
      {
        id: "pet",
        icon: "♡",
        name: "Gentle Paws",
        desc: "Pet your cat 5 times.",
        done: data.pets >= 5
      },
      {
        id: "feed",
        icon: "🍓",
        name: "Little Foodie",
        desc: "Feed your cat 3 times.",
        done: data.feeds >= 3
      },
      {
        id: "games",
        icon: "🎮",
        name: "Playtime!",
        desc: "Finish 3 mini-games.",
        done: data.gamesPlayed >= 3
      },
      {
        id: "level",
        icon: "✦",
        name: "Growing Together",
        desc: "Reach level 2.",
        done: data.level >= 2
      },
      {
        id: "decor",
        icon: "🏡",
        name: "Home Sweet Home",
        desc: "Collect a home decoration.",
        done: data.decorations.length > 0 ||
          data.roomItems.length > 0
      }
    ];
  }

  return {
    load,
    save,
    get,
    reset,
    adopt,
    reward,
    spend,
    pet,
    feed,
    play,
    buy,
    decorate,
    placeDecoration,
    moveDecoration,
    removeDecoration,
    recordCatchCatsBest,
    gamePlayed,
    tick,
    achievements
  };
})();

// COMPLETE CODE — END OF js/game.js