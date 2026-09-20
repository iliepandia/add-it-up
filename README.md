# add-it-up
Game for Kids to practice addition in a fun way

# Play the game

[Open the game](https://iliepandia.github.io/add-it-up/addition-game.html?ver=99)

# Development

The game is built from modular source in `src/` and bundled by Vite into a
single self-contained `addition-game.html` at the repo root — that's the file
GitHub Pages serves, so **don't edit `addition-game.html` by hand**; it's a
generated build artifact.

```
src/
  core
    main.js       game loop / wiring (composition root)
    config.js     constants, timing, emoji/pip data
    state.js      shared mutable game state
    dom.js        cached DOM element references
    problem.js    problem generation + rendering (digits/emoji/pips)
  presentation
    audio.js      synthesized sound effects
    fx.js         generic particle/animation primitives ("animations")
    rewards.js    milestone celebration animations ("rewards")
    stars.js      star crown, streak indicator, badges ("streaks")
    themes.js     theme table, current theme, world backgrounds ("theme selection")
  screens
    picker.js     "pick a world" screen ("intro")
    win.js        trophy reveal + closing screen ("end screen")
    snake.js      crawling-snake easter egg on the win screen (perfect games)
    statsScreen.js  stats screen UI (tiles, charts, mistakes list)
  fast mode (the opt-in timed difficulty)
    difficulty.js      Easy/Fast toggle, mode gating, falling-bike look
    hardDifficulty.js  the adaptive water-bar drain speed, persisted per child
    waterBar.js        the draining timer bar under the problem card
    presentationPicker.js  the child picks how to see each problem
  prizes & progress
    prizes.js     persistent prize collection (localStorage, survives a stats reset)
    prizeBox.js   the prize-box shelf screen + per-prize tap sounds
    prizeCombo.js hard-mode tap combos: charge on tap 2, erupt on tap 3
    mastery.js    7-day mastery badge (snail → dinosaur → trophy)
    stats.js      local play-stats storage (sessions, scores, mistakes, response
                  times) — localStorage only, no network
  styles/         CSS split to match the modules above
index.html        dev entry point (Vite serves this)
```

The groupings above are for reading convenience only — every module lives flat
in `src/`.

Setup:

```
npm install
```

Run a local dev server with hot reload while working on a module:

```
npm run dev
```

Build the final static page (regenerates `addition-game.html`):

```
npm run build
```

Bump the `?ver=` query param in this README when you deploy, so GitHub
Pages' cache doesn't serve a stale copy.

# Docs

- [`addition-game-spec.md`](addition-game-spec.md) — what the game **is**: the
  complete specification of everything built (§1–§15 Easy mode, §18 Fast mode).
- [`addition-game-future.md`](addition-game-future.md) — what it **isn't yet**:
  the Phase 2 learning-design backlog, open items, and a gap analysis of the
  shipped game against both.
