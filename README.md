# Amethyst Paws — A Cozy Cat Adventure

A single-player browser game designed for the Amethyst Reverie community.

## Run locally
Open `index.html` in a modern browser. For best results, use a local static server or the GitHub Pages preview.

## Deploy to GitHub Pages
1. Create a new GitHub repository (for example, `amethyst-paws`).
2. Upload the contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site.

## Architecture
- `index.html`: screen structure and semantic UI
- `styles.css`: responsive visual system and animations
- `js/app.js`: navigation, UI rendering, mini-games and event handlers
- `js/game.js`: game state, progression, economy, achievements and local save
- `js/audio.js`: original synthesized background music and sound effects
- `js/dialogs.js`: reusable accessible custom confirmation, input and notification UI
- `js/cozy-home.js`: owned furniture inventory, placement, pointer dragging and room layout rendering
- `js/catch-cats.js`: six-window, three-floor Catch the Cats mini-game and round rewards
- `assets/`: original SVG artwork and favicon

## Important behavior
- Single-player only. No accounts, multiplayer, backend, or server-side storage.
- Progress is saved in the current browser using LocalStorage. Clearing browser data or changing devices can remove or separate the save.
- Audio starts after the player's first interaction because browsers restrict autoplay.
- Cozy Home furniture ownership and room coordinates are stored in the existing LocalStorage save. Existing decoration saves are migrated into room placements.
- Catch the Cats stores its best score and grants coins/XP through the existing game reward functions.
- Custom dialogs and toasts use the Amethyst Paws visual system; the reset confirmation no longer uses a browser-native dialog.
- Discord invite: https://discord.gg/DTejps2vMk

## Before public launch
Test on Android Chrome and desktop browsers. Check GitHub Pages paths, audio behavior, LocalStorage persistence, mini-game completion, and the Discord invite. If custom audio files or additional illustrations are added later, use assets that the project owner has permission to distribute.
