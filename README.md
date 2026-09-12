# add-it-up
Game for Kids to practice addition in a fun way

# Play the game

[Open the game](https://iliepandia.github.io/add-it-up/addition-game.html?ver=10)

# Development

The game is built from modular source in `src/` and bundled by Vite into a
single self-contained `addition-game.html` at the repo root — that's the file
GitHub Pages serves, so **don't edit `addition-game.html` by hand**; it's a
generated build artifact.

```
src/
  main.js       game loop / wiring (composition root)
  config.js     constants, timing, emoji/pip data
  state.js      shared mutable game state
  dom.js        cached DOM element references
  audio.js      synthesized sound effects
  problem.js    problem generation + rendering (digits/emoji/pips)
  stars.js      star crown, streak indicator, badges ("streaks")
  themes.js     theme table, current theme, world backgrounds ("theme selection")
  rewards.js    milestone celebration animations ("rewards")
  fx.js         generic particle/animation primitives ("animations")
  win.js        trophy reveal + closing screen ("end screen")
  picker.js     "pick a world" screen ("intro")
  styles/       CSS split to match the modules above
index.html      dev entry point (Vite serves this)
```

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
