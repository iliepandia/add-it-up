# Addition Game — Specification

**Purpose:** A web game that helps a 7-year-old practice single-digit addition, with a stated
long-term direction (§17.6) of building **fast, automatic recall** — not just eventual
accuracy. The child already understands addition; the goal is fluency, not concept-teaching.
**Status:** Clarified and locked, ready to build.
**Last updated:** 2026-09-18

> **Scope:** Sections 1–16 are **Phase 1 — build now**. Section 17 is **Phase 2 — deferred, do not build now** (learning-design upgrades captured for a later version).

---

## 1. Goal

An engaging addition game for a 7-year-old. Each round presents `a + b`, the child
enters the answer, and the game reacts (celebrate / retry). A session runs for **10
correct answers** — one star per correct answer — then shows a win screen (see §9).

---

## 2. Platform

- Single web page.
- Must work on **desktop and mobile** (touch and keyboard).
- No external asset files required (sounds are synthesized in-browser; see §8).
- **Portrait lock (mobile/tablet):** the page is plain HTML with no native wrapper (no
  Capacitor/Cordova), so there's no OS-level orientation lock available. Instead, a full-screen
  **"please rotate your device" overlay** covers the game whenever a touch device
  (`pointer: coarse`) is held in landscape, blocking play until it's turned back to portrait.
  Desktop browser windows are unaffected (`pointer: fine` is exempt).

---

## 3. Number rules

| Rule | Value |
|------|-------|
| Operand range | **1–9** (0 is never used) |
| Sum constraint | **Dynamic (difficulty ramp).** Starts at **5**; **+1 per correct** (max **12**), **−2 per wrong** (min **5**). Resets to 5 each new game. |
| Repeats | Allowed (e.g. `4 + 4`) |
| Generation | Re-roll the pair until the constraint is satisfied. Method is unconstrained as long as the result obeys the rules. |

**Answer range:** 2–12 → one digit (2–9) or two digits (10, 11, 12). The live max depends on
the current ramp level (see Sum constraint).

---

## 4. Presentations

Each problem picks **one of three presentations at random**:

1. **Digits** — `2 + 3 =`
2. **Emoji groups** — one repeated emoji per operand, e.g. 😄😄😄😄 + 😄😄 =
   - **Emoji category matches the active theme (§10)**, so the pictures feel like they belong
     to that world instead of being generic:
     - **Nature** 🌳 draws only from the nature set (flowers, leaves, butterflies…).
     - **Animal** 🐔 draws from fruit + animals + birds.
     - **Space** 🚀 draws from a dedicated space set (rocket, planets, moon, alien…).
     - **Classic** 👦 draws from the full pool (animals, fruit, nature, birds, household items) —
       it has no strong theme, so it keeps the original variety.
3. **Pips** — dice faces or domino tiles, e.g. `.` + `..` =
   - **Cap: 6 pips per operand.** If either operand is > 6, re-roll the pair for this
     problem (pip presentation only).
   - Groups are laid out on a small grid that never wraps past **2 rows**, with the glyph
     size shrinking as the count grows — so even a 9-item group can't push the keypad off
     the bottom of the screen on a narrow phone.

> **Note:** the pip cap (6 per operand) allows sums up to `6 + 6 = 12`, which matches the ramp's
> top. So **all three presentations cover the full 2–12 range** at max difficulty.

---

## 5. Input

- **Digit tray 0–9** shown at the bottom, fully unrestricted (all ten keys always live).
- **Two commit keys** flank the **0** key: a red **✕ (clear)** on the left, a green
  **✓ (submit)** on the right — fixed red/green colors regardless of the active theme, since
  they're commit-flow controls, not themed number keys.
- **At most 2 digits** may be entered (the answer's max is 12, §3, so 2 digits always suffice);
  a 3rd digit tap is silently ignored.
- **Keyboard equivalents** are also accepted — input is **global** (no field to focus):
  digit keys `0`–`9`, **Enter** to submit, **Backspace / Delete / Escape** to clear.
- The answer appears **inline in the equation** (`3 + 5 = ▏`) with a **blinking caret** when
  empty — deliberately *not* styled as a text-input box.
- **Dimmed-until-ready:** both ✕ and ✓ start at **40% opacity and 0.75× size** (nothing to
  clear or submit yet). The instant the first digit is typed, both **pop active** with a
  "tada" overshoot (scale past **1.22×**, settle through **0.94×**, land at **1×**) instead of
  just snapping to size. The ✓ additionally grows a **pulsing yellow glow** behind it and its
  checkmark glyph pulses **0.8×–1.1×**, both at the same **~0.43s** cadence — drawing the eye
  to the natural next action.

---

## 6. Answer checking (explicit commit)

Nothing is evaluated until the child **taps ✓ (or presses Enter)** — typing digits only fills
the on-screen entry, it never auto-checks. On submit:

- Entry **equals** the correct answer → **correct**.
- **Anything else → wrong.**

**Why:** the original design auto-checked after every keystroke (see git history for the old
prefix-logic rule), so a single fat-fingered tap on a wrong digit instantly resolved as a full
wrong answer — even a tap meant to be corrected. Requiring an explicit ✓ (with ✕ to clear a
mis-tap first) removes that noise: a recorded "wrong" now reliably means the child didn't know
the fact, not that their thumb slipped — a cleaner signal for any future scaffolding/adaptivity
work (§17.2, §17.3) to build on.

**Correct path timing:** on a correct submission, wait **200 ms** so the child sees their
answer on screen, *then* trigger the celebration.

---

## 7. Feedback & animation

### Correct
- **Emoji explosion** of particles, sized **~3× base** (large, screen-filling burst).
- All particles in a single burst are the **same** emoji.
- Each burst picks a **random** emoji from a *happy* set (heart, present, smiley, star, etc.).
- **Star smash:** the earned star first appears **huge at screen centre**, holds a beat, then
  flies down and **smashes into its slot** (impact ring + burst fire on landing) — makes the
  win unmistakable.
- Sequence ≈ **200 ms** (see the number) → **~0.9 s** star flight → **~1.2 s** dwell, then the
  next problem. *(Was a flat 3 s hold; front-loaded into the star moment.)*
- **Streak** = consecutive correct answers; **resets on any wrong**. While a streak is running,
  every star that's part of it shows a **red disk behind it**; the disks clear the instant a wrong
  breaks the streak.
- **Streak rewards** fire after the star is awarded, layered on the celebration:
  - **3 in a row:** a **rain of candy** (large candy, ~3 s).
  - **6 in a row:** a **giant spaceship** flies slowly across the screen (~3.8 s), always along
    a fixed **diagonal bottom-left → top-right** path that crosses the exact centre of the
    screen regardless of phone or desktop aspect ratio.
  - **9 in a row:** lots of **big bubbles** float up (~3 s).
- **Prize badges:** each not-yet-earned milestone shows a small badge on the star whose fill will
  complete it — 🍬 for the next 3-streak, 🚀 for 6, 🫧 for 9 — so the child sees how far to the next
  prize. Badges reposition as the streak grows and after a wrong; a prize with too few stars left
  to reach shows no badge.

### Wrong
- **Shake** the on-screen items.
- Flash a centered **thinking face 🤔 or question emoji ❓** (randomly chosen).
  *(Replaces the earlier sad/angry/“X” idea — deliberately gentler for a young learner.)*
- **1st wrong:** after **1 second**, reset the input to empty and **re-show the exact same
  problem in the exact same presentation**. No star awarded.
- **2nd wrong (same problem):** guided correction so the child enters it themselves —
  1. **Reveal** the correct answer (green, **"ta-da!" pop** + sparkles + fanfare) and **keep it on
     screen**.
  2. **Wait 500 ms.**
  3. **Flash the correct key(s)** on the keypad, demoing the full sequence **twice** — for a
     two-digit answer (10, 11, or 12) that's the first digit's key then the second, repeated (so
     `11` flashes the `1` key four times, `10` flashes `1,0,1,0`, `12` flashes `1,2,1,2`).
  4. **Reset the exercise:** clear the answer and re-ask the **same** problem — the child types it.
  - The re-ask is a **fresh attempt**: wrong-count resets, and a correct entry now **earns the
    star**. (If a twice-missed problem should never award a star, gate this — currently it does.)
  *(Prevents the child getting trapped on a fact they don't know; a light Phase-1 version of the
  scaffolding in §17.2.)*

---

## 8. Sound

Synthesized in-browser (Web Audio), unlocked on the first user tap (mobile autoplay policy):

| Event | Sound |
|-------|-------|
| Key / tray press | click |
| Correct explosion | pop / party |
| Wrong answer | ding-ding |
| A snake-easter-egg trophy touch (§14) | ding (same two-tone chime as the Space theme's key press) |
| Tapping a prize in the prize box (§12) | a sound matched to *that specific prize*, not random |
| Tapping the mastery badge (§13) | ding |

Sound is best-effort — the game must remain fully playable if audio is unavailable.

---

## 9. Session, progress & win condition

**Star row (progress):**
- A row of **10 stars** is shown at the **top of the screen**, persistent across problems.
- All start **empty** (☆). Each **correct** answer fills the next one (⭐).
- The star fills at the **moment of the correct-answer celebration** (§7), so the child
  connects "I got it right" → "a star lit up." (Optional: a short star "ting" sound.)
- Wrong answers never fill a star directly; after the 2nd-wrong guided correction the child
  re-attempts the same problem and can then earn the star (§7).

**Loop:** `generate problem → accept input → check → feedback → (correct) fill star + next / (wrong) retry same`.

**Win condition:**
- When the **10th** star fills, the session **ends** — no new problem is generated.
- Show **"Good job!"**, then a **randomly chosen emoji** (from a pool of **60** — animals,
  nature, treats, vehicles, and household objects) **repeated once per point of the longest
  streak** reached this game. That same emoji is also the game's **prize** — see §12.
- The copies **reveal one at a time**, each with a **rising musical note**; when the reveal
  finishes (the sound is over), a **star explosion** bursts over the screen.
- **Layout freeze:** the instant the reveal finishes, every trophy's on-screen position is
  captured and pinned (`position: absolute`, explicit `left`/`top`) instead of staying in the
  flex-wrap layout used to lay them out. This is what lets trophies be removed one at a time
  (by tap, or by the snake easter egg in §14) **without the rest re-packing/shifting** —
  positions are read for every trophy *before* any of them is pinned, so pinning an early one
  can't reflow (and bunch up) the ones read after it.
- **Trophies become tappable** once the layout is frozen: tapping one bursts it into **30 stars**
  at its position and removes it. The **last remaining trophy** bursts bigger instead — **~60**
  larger stars plus a brief **screen shake** — as a small finale (skipped under
  `prefers-reduced-motion`, which still keeps a smaller star burst).
- Also show the hint **"Tap to play again"** and a **big orange "Play" button**.
- **Restart:** the Play button **or any tap/key not on a trophy** starts a new session (stars,
  difficulty, and longest-streak all reset), returning first to the theme picker (§10) — which
  also stops the snake easter egg (§14) if one is running.

---

## 10. Themes

Before **every** game the player sees a **theme picker**: four big buttons, each an **animated
emoji** that also previews that theme's button colors. Tapping one (or pressing **1–4**) starts a
fresh game in that world. Button animations: **👦 jumps** (classic), **🌳 sways** (nature),
**🚀 bounces** (space), **🐔 shakes** (animal).

A theme changes the **background**, the **keypad + Play button colors**, the three **streak-reward
visuals**, the **emoji-presentation category** (§4), and the **key-press sound**. The **problem
card stays white with navy numbers** in every theme for legibility; the **prize badges** (§7) use
each theme's own reward emojis; on dark themes the empty-star colour is lightened for contrast.
Background/button motion is minimised under `prefers-reduced-motion`.

| Theme | Background | Keys (bg / text, contrast) | Streak 3 / 6 / 9 | Key sound |
|-------|-----------|----------------------------|------------------|-----------|
| **Classic** 👦 | sky→mint gradient | tangerine `#FF8A5B` / white | candy rain / spaceship (diagonal) / bubbles up | click |
| **Nature** 🌳 | blue sky, sun, drifting clouds | dark green `#2E7D32` / white (~5:1) | leaves fall / bird across the sky / ice cream up | click |
| **Space** 🚀 | dark-magenta sky, quick-flickering starfield | white / magenta `#7A1466` (~7:1) | stars fall / rocket (diagonal) / volcanoes up | ding |
| **Animal** 🐔 | blue sky, green hills | barn red `#C6402F` / white (~4.7:1) | apples fall / tractor (across the middle) / bees up | squeak |

"Flies by" direction: the rocket launches **diagonally**; the bird crosses the upper **sky** and
the tractor crosses the **middle** of the screen (both horizontal) so each faces its travel
direction. The streak-6 fly-by also carries a **matching sound** — rocket **zoom**, bird
**chirp**, or tractor **rumble** — each stretched to span the **full ~3.8 s** of the flight.

---

## 11. Local stats & history

Reachable via a small **"📊 Stats"** link in the bottom-right corner of the theme-picker screen
(§10). Everything is stored **locally on-device only** (browser `localStorage`) — there is no
server and no data ever leaves the device.

**Play-time definition:** a "session" is **active gameplay only**. The clock starts the instant
a theme is picked and stops the instant the player returns to the theme picker — including via
the win screen's "tap to play again" (§9). Time spent browsing the theme picker or the stats
screen itself is **never** counted as play time. A session longer than **15 minutes** is treated
as **abandoned** and excluded from the time stats (the day still counts toward "days played").

**Score:** each completed game (reaching the 10th star, §9) is scored **out of 10** — start at
10, **−1 per wrong submission** across the whole game, floor of **0**.

**Tracked stats:**

| Stat | Notes |
|------|-------|
| Games played | all-time count |
| Average score | all-time, out of 10 |
| Best score | all-time max, out of 10 |
| Accuracy | correct ÷ (correct + wrong) across all games |
| Longest streak | best consecutive-correct streak ever reached |
| Total play time | sum of finalized sessions (see definition above) |
| Average / shortest / longest session | over finalized sessions |
| Days played | distinct calendar days with at least one session (today counts the moment a game starts, without waiting for the session to end) |
| Favorite this week | theme played most in the **last 7 days** (not an all-time tally, so it tracks current taste rather than getting stuck on whichever theme had an early lead) |

**Charts** (hand-drawn inline SVG, no charting library):
- **Last 30 games** — bar chart of the most recent games' scores.
- **Last 30 days** — line chart of each day's average score across the last 30 calendar days
  (a day with no games leaves a gap in the line).

**Trickiest problems (last 7 days):** the top 10 most-missed `a + b` combinations, each with a
mistake counter, sorted by frequency. A wrong *submission* counts as a mistake, so missing the
same problem twice before getting it counts as two. Scoped to the **trailing 7 days** (not
all-time) so a rough patch early on, or a fact since mastered, doesn't sit pinned at the top
forever — same reasoning as "Favorite this week" above. Backed by a timestamped log
(`{a, b, t}` per miss) that self-prunes to the 7-day window on every write.

**Response time (last 30 days):** §17.6's baseline-measurement step — see that section for the
full reasoning and the non-negotiable safety constraint it operates under. In short: every
problem's **first attempt** (correct or wrong; retries after a miss don't re-log) has its
latency recorded — time from the problem appearing to ✓/Enter being pressed — tagged with its
presentation (§4) and its larger operand. This is **purely passive**: no timer, countdown, or
any speed-related feedback is ever shown to the child, and nothing here affects scoring, difficulty,
or any in-game reward. Two views on the stats screen, both scoped to the trailing 30 days:
- **By presentation** — Min / Median / Max (with sample count) for Digits, Emoji, Pips, and
  Combined.
- **By operand size** — the same four groups, each split into **Small (≤4)** vs **Large (5–9)**,
  median + count only. This exists because operand size confounds the presentation comparison:
  emoji/pips add a "figure out how many are in this pile" step that scales with the larger
  operand and digits doesn't have at all, so a raw per-presentation median can't tell "this
  representation is slow" apart from "big numbers are slow, and this presentation happens to
  show them raw." (Pips' "Large" column only ever reflects 5–6, never 7–9, since §4 caps pip
  operands at 6 — a structural asymmetry worth knowing when reading that row.)

**Reset:** a small, de-emphasized "Reset stats" link sits well below the Close button — spaced
apart deliberately to avoid an accidental tap — and opens an inline **confirm / cancel** prompt.
Nothing is deleted until the destructive option is explicitly confirmed — including the mistake
and response-time logs above, which live in the same storage.

---

## 12. Prize box & collectible prizes

Reachable via a **📦 button** on the theme-picker screen (§10), below the world-select grid.
Stored **locally on-device only** (its own `localStorage` key, separate from stats — §11's
"Reset stats" never touches it), so prizes are permanent unless a dedicated reset is added later.

**Earning a prize:**
- **Every finished game** (10th star, §9) adds **exactly one prize** to the box: the same random
  emoji chosen for that game's trophies (drawn from the 60-emoji pool, §9).
- **Prize size reflects that game's score** (§11's out-of-10 score), rewarding a strong run
  rather than just finishing:

  | Score | Tile size |
  |-------|-----------|
  | 0–3 | 0.75× |
  | 4–7 | 1× (normal) |
  | 8–9 | 1.25× |
  | 10 (perfect — no mistakes) | **1.5×**, plus a **rainbow ring** around the tile whose colors cycle in place (the ring itself never moves — only its hue animates) |

  Prizes earned before this sizing existed have no recorded score and render at the normal 1×
  size — history is never re-guessed retroactively.

**Box screen:**
- Background is a **light wood-grain pattern** (CSS gradients — no image asset).
- Prizes lay out as a **wrapping grid** (left-to-right, wrapping to the next row), the whole
  screen **scrolling vertically** once there are more than fit on one page.
- Prizes appear **in the order they were earned** (not grouped by type) — chronological, since
  storage is append-only.
- Each prize is two nested elements: a **fixed-size outer cell** (its grid slot — never itself
  animated or moved) containing an **inner emoji face** that plays the entrance pop and tap
  reactions below. Keeping the two separate means a tile reacting to a tap never shifts its
  neighbors.
- **Tapping a prize** plays one random visual reaction from a set of ten (tada, shake, jump,
  rotate, wobble, bounce, pulse, flip, swing, heartbeat) — just a fun, replayable touch, no game
  effect.
- **Tap sounds are matched to the specific prize**, not random: all 60 win-pool emoji (§9) each
  map to one of ~40 synthesized "sound families" — animal calls (bark, meow, moo, oink, quack,
  neigh, roar, ribbit, hoot, …), vehicle noises (rocket whoosh, bike bell, car horn, train
  chuff-chuff-whistle, helicopter whir, sailboat whoosh, UFO warble), food/sweets, toys/circus,
  and nature/sky chimes — so tapping 🐶 barks, 🚀 whooshes, 🍪 crunches, etc. Closely related
  prizes intentionally share a family (🦁/🐯/🦖 all roar, 🌻/🌸/🌺/🌼 all get the same bloom
  chime) rather than every one of the 60 needing a fully bespoke sound. Every sound is
  synthesized (Web Audio, no audio files, §8), built from two shared pieces: a short filtered
  **noise burst** (the breath/mechanical texture a pure tone can't fake) and a resonant-filtered,
  pitch-swept oscillator "**growl**" for animal calls — deliberately more elaborate than a bare
  tone, though still stylized synthesis rather than real recordings (revisit with real sample
  audio if truer realism is ever wanted — see trade-offs in §15).
- **Hard-mode prizes have their own matched sounds too.** Hard mode wins from a separate glyph
  pool (§16), so it carries a second bank of families, built from the same pieces and mapped the
  same way: beasts (dragon roar, wolf howl, shark chomp, bat screech, ape grunt + chest thump,
  scorpion skitter), fire & energy (crackle, firecracker bang, explosion, sparkler, volcano
  rumble, electric zap, siren, magnet hum, potion fizz), weapons & metal (sword clash, shield
  clang, axe chop, pickaxe strike, bow twang, trident ring, punch thud), treasure & magic (gem
  chime, crown/trophy fanfare, medal clink, key jingle, crystal hum, wand sparkle), arcade gear
  (blip, dice roll, card flick, slot reels + payout, dart thunk, puzzle click, bowling crash), and
  gear/weather/sky (compass ping, stopwatch ticks + bell, desk bell, horn call, flag flap, tornado
  whoosh, wave crash, brick thud, chain clink, boomerang whirl, sled swish, mountain wind,
  shooting star, comet whoosh, satellite beeps). These run **punchier and lower** than the easy
  set, matching hard mode's higher stakes. 🥇 and 🎖️ share one medal chime, and 🦖 — the only glyph
  in both pools — reuses the same roar either way, so all 60 hard glyphs are covered by 59 sounds.
- A **← back button** (top-left) returns to the theme picker.
- **Empty state:** "Finish a game to win your first prize!" if none are collected yet.

---

## 13. Mastery badge

A round badge sits next to the 📦 button on the theme-picker screen (§10), showing a **7-day
precision** (accuracy) signal that persists across sessions — a visible mastery signal beyond
any single game (directly addresses §17.4's competence-signal recommendation).

- **11 emoji tiers:** 🐌🐔🐢🐝🐷🐱🐶🐄🐻🦖, spanning **50%–100%** 7-day precision in even
  **5-point bands** (below 50%, or no games in the trailing 7 days, shows the snail at 0%
  fill), plus a bonus **🏆** reserved exclusively for an **exact** 100% — zero wrong submissions
  in the window, not just rounding up to it.
- **Precision** reuses the same correct ÷ (correct + wrong) formula as §11's all-time Accuracy
  stat, scoped to games finished in the last 7 days.
- **Arc:** a thin gold ring fills across each tier's own 5-point span, so every **0.5%** of
  precision moves the arc a fixed **10%** (10 half-percent steps = one full tier).
- **Emoji size** scales evenly from **1.0×** (snail) to **2.0×** (trophy) across the 11 tiers.
- **Trophy tier** swaps the gold ring for a **spinning rainbow ring** — colors cycle in place,
  the ring itself never rotates — the same technique as the perfect-game prize-tile ring (§12).
- **Next-badge preview:** tapping the badge dings and pops up a speech-bubble balloon (bounce-in,
  ~0.45s) showing the **next tier's emoji** and the precision needed to reach it (or "You're a
  champion!" once at the trophy). A second tap, or **3 seconds** of no input, pops it back down
  with a quick shrink-out. The "stay open" state is a plain CSS class rather than relying on an
  animation's fill-mode to hold its last frame, so the 3-second dwell can't be silently cut short.
- **Test mode:** a hidden developer shortcut for previewing every tier without grinding out real
  games — see §15 for how to enable it and what it unlocks (including a fast path to testing
  §14's snake).

---

## 14. Win-screen snake easter egg

A **retro, block-based snake** (green segments + a head, reminiscent of classic console Snake)
occasionally crawls across the win screen (§9).

- **Trigger:** only after a **perfect game** (score 10, §11) — and even then, only a **1-in-3**
  chance, so it's a rare surprise rather than an expected reward.
- **Rendering:** lives in a dedicated layer that is the **first child of the win screen**, given
  a **negative `z-index`** so it paints behind every other win-screen element (trophies, "Good
  job!", the Play button) and above only the win screen's own background. It never intercepts
  taps.
- **Movement:** an 8-block worm advancing one grid cell (~26px) every 150ms, making **sharp 90°
  turns** — never a 180° reversal — either at random or whenever it's forced to (about to run off
  the edge of the screen, or into its own body). It **always turns before hitting a wall or
  itself**, so it stays fully on screen and never self-collides.
- **Starting position:** a **random** grid cell (not the screen center).
- **Eating trophies:** on every step, the snake reports its current segments' positions; any
  trophy a segment overlaps (any segment, not just the head) **shrinks to scale 0 over ~0.125s
  with a "ding"** and is removed immediately — distinct from (and simpler than) the tap-to-pop
  celebration in §9. This can only happen once the win screen's trophy layout has been frozen
  (§9), so it never fights the staggered reveal.
- **Eating animation:** each touch also queues an "eat" — the snake **stops moving** and plays a
  bulge: the head **pops to ~4.3× its normal size** and opens a big dark **"O" mouth**, then the
  pop **travels tail-ward through the body** (each segment popping to ~3.5×, staggered ~90ms
  apart, ~0.26s per segment's own pop). **2 or more prizes touched at once** (easy with a dense
  field of trophies) queue their eat animations and play them **one at a time**, snake frozen the
  whole time — never overlapping. Movement (and new-touch detection) **resumes automatically**
  once the queue empties. Implementation note: each body block is a positioning shell plus an
  inner "face" div, so the pop's scale animation never fights the shell's movement transform.
- **Shrinking away:** after crawling at full length for **20s**, the snake starts shedding one
  tail block roughly every 400ms until it's gone (~3s to fully vanish) — it doesn't crawl
  forever.
- **Stopping:** leaving the win screen (Play button, or any tap/key that returns to the theme
  picker, §9) stops the snake immediately, wherever it is.
- Skipped entirely under `prefers-reduced-motion`, consistent with the other particle-effect
  rewards (§7).

---

## 15. Testing (developer/QA shortcuts)

Hidden keyboard shortcuts, live only on the **theme-picker screen** (§10), for previewing
end-states without grinding out real games. They never touch real stats or the prize box.

**Enable/disable:** type **T-E-S-T** (dings each time; typing it again toggles back off). Typing
works anywhere on the picker screen — no field to focus, same as normal digit input (§5).

**While test mode is on:**

| Key(s) | Effect |
|--------|--------|
| **Up / Down** | Nudges the mastery badge's (§13) *displayed* 7-day precision by ±0.5%, without touching real stats — the fast way to step through all 11 tiers and watch the arc fill. |
| **S** | Jumps straight to the win screen (§9) with a full **10 trophies** revealed and the snake (§14) **forced active** — bypassing the normal perfect-game-only + 1-in-3-lottery gates. The fast way to test the snake's crawl, its eat animation, and multi-prize queueing without needing to actually play (and win, flawlessly) a real game first. |

**Note on S:** typing T-E-S-T a *second* time (to toggle test mode back off) also types an "s" as
its 3rd letter. So **S only triggers the win-screen jump when pressed as a fresh keystroke** (not
mid-way through retyping T-E-S-T) — otherwise every attempt to toggle test mode off would instead
jump to the win screen.

**Leaving:** the S jump's win screen behaves exactly like a real one — the Play button, or any
tap/key not on a trophy, returns to the picker (§9) with test mode's on/off state unchanged.

---

## 16. Open items / future tweaks

- A **linear difficulty ramp** is now in Phase 1 (§3, sum 5→12); the **adaptive, fact-tracking**
  version remains Phase 2 (§17.3).
- Prize-box and mastery-badge tap sounds (§12, §13) are stylized synthesis (Web Audio, no audio
  files, §8) — meaningfully better than plain oscillator tones, but still a synth's approximation
  of a bark or a train, not a real recording. Revisit with real sample audio if truer realism is
  ever wanted; that would mean sourcing license-cleared clips and dropping the current
  single-HTML-file build (§2), so it's a deliberate trade-off, not an oversight.
- **Latency tracking is step 1 of 2 — step 1 now shipped, step 2 still not.** §17.6's baseline
  measurement (per-answer response time, by presentation and operand size, §11) is built and
  passively collecting — with zero visible effect on the game, per its own constraint. **Step 2
  is not started:** deciding what "improvement" means relative to each child's own baseline, and
  building anything (reward, mechanic, or adaptivity change) on top of it, is still deferred
  Phase 2 work (§17.6) — the data existing doesn't mean it's time to act on it yet; §17.6 is
  explicit that step 2 needs real play data to calibrate against, not a guess, and that's still
  true even with step 1 done. Every other stat and scoring rule (§6) remains purely
  correctness-based, unaffected by this.

---

## 17. Phase 2 — Learning design (deferred, do not build now)

Upgrades to make the math *emerge from play* rather than be a toll paid to reach a reward.
Ordered by leverage toward that goal; each is paired with the theory it draws on.

> **Progress check (2026-09-17):** everything built since the last review — the input commit
> mechanism (§5/§6), prize-box tap sounds matched to each emoji (§12), and the mastery badge
> (§13) — is engagement/UX polish and information-signal quality, not learning design. Of the
> five items below, only **17.4's competence half** has meaningfully landed: the mastery badge
> is exactly the persistent, visible mastery-progress signal it calls for, on top of the
> pre-existing stats screen (§11). Its **autonomy** half is still just theme selection; a
> deeper in-game choice hasn't been built. **17.1** (intrinsic integration), **17.2**
> (second-wrong scaffolding), **17.3** (adaptivity), and **17.5** (sequenced representations)
> remain entirely unaddressed. One side-benefit worth noting for 17.2/17.3: §6's move to an
> explicit commit-to-submit means a recorded "wrong" now reliably reflects the child not
> knowing the fact rather than a mis-tap — a cleaner signal for either to build on when
> they're eventually tackled. *(2026-09-18 update: the snake's eat animation, §14, and the §15
> test shortcuts are the same kind of polish/tooling — no change to this assessment. Separately,
> §17.1/17.3/17.5 below were revised the same day — this game's actual goal is fluency/speed for
> a child who already understands addition, not concept-teaching, which the concrete-manipulative
> framing those items originally borrowed was aimed at. See new §17.6 — since strengthened with a
> non-negotiable constraint (baseline-first measurement, reward-only/never-punitive) after review
> flagged the first pass as not protective enough of a 7-year-old's normal response time. §17.6's
> step 1 — the passive latency baseline itself — then actually shipped the same day, §11. Nothing
> past step 1 has been built; collecting the data isn't a green light to act on it yet, §16.)*

### 17.1 Make the numbers have a purpose (intrinsic integration) — *highest leverage, revised*
The Phase 1 game is a **drill with juice**: solve the sum → get the fireworks. The math is
the toll, not the play. The fix is **not** concrete manipulation (feed-a-creature,
fill-a-jar-style counting play — the earlier version of this item, and my own first pass in
conversation) — this game's target skill is **fast mental recall**, not concept acquisition,
and anything that invites counting objects works against that goal (§17.6). Instead, make the
*fun mechanic's real-time responsiveness* run on how fast and accurately the child recalls the
answer — e.g. a chase where speed of correct recall keeps a character ahead of something, a
combo that lights up extra under a (personally-calibrated, never guessed — §17.6) pace, a rhythm
the child keeps pace with. The addition becomes the thing the game's core tempo runs on, not a
gate in front of an unrelated reward — but the "not fast enough" outcome must stay strictly
neutral, never a losing state (§17.6's constraint is non-negotiable here too).
*(Malone & Lepper; Habgood & Ainsworth, intrinsic integration — note the concrete-manipulative
examples common in this literature target concept acquisition, not fluency; §17.6 has the
reasoning specific to this game.)*

### 17.2 Scaffold the second wrong attempt — *highest safety priority*
Phase 1 re-shows the identical problem until correct, with no teaching — a recipe for math
anxiety and learned helplessness when the child genuinely doesn't know the fact. Keep the
never-skip rule, but on the **second** miss, *help*: reveal pips under the digits, animate a
count-up, show a number line, or decompose (`8 + 7 → 8 + 2 = 10, then +5`). Reframe errors as
information, not verdicts. *(Dweck, growth mindset; Seligman, learned helplessness.)*

### 17.3 Adaptivity + fact-memory — *revised: speed is half the signal*
Flat random difficulty prevents flow and a felt sense of progress. Track which addend pairs the
child misses **or answers slowly**, resurface them (spaced retrieval / testing effect), and let
difficulty drift upward as accuracy *and speed* rise — not accuracy alone.
*(Csikszentmihalyi, flow; Roediger, testing effect.)* The mistake-frequency tracking already
shipped in §11 (now 7-day-scoped) is the accuracy half of this data; the speed half needs the
latency tracking called out in §16/§17.6 — a fact answered correctly but slowly can be *treated*
like a miss by the backend resurfacing logic (both mean "not yet automatic"), but never *shown*
to the child that way — §17.6's constraint applies here too, not just to scoring.

### 17.4 Surface competence + one autonomy choice — *competence half now shipped*
Give a visible mastery signal beyond a single session (levels, cumulative progress) and at
least one real choice (choose between two problems, or a sub-mode). *(Deci & Ryan,
Self-Determination Theory — competence + autonomy.)* The **competence** half is now addressed:
the mastery badge (§13) is exactly this — an 11-tier, cross-session progress signal — layered
on the stats screen's (§11) existing persistent numbers. World/theme selection (§10) still
covers only the shallow end of **autonomy**; a deeper in-game choice (between two problems, or
a sub-mode) remains unbuilt.

### 17.5 Sequence the representations (don't randomize blindly) — *revised*
The original framing here — lead concrete, fade toward abstract, as if pips/emoji were a
scaffold for a child still learning what addition *means* — doesn't fit this game: the child
already has the concept. Pips/emoji only still serve the fluency goal if they stay **instantly
recognized (subitized)** rather than **counted** — a die face read as "six" in one glance trains
the same fast-pattern-recall the game wants; the same six dots counted one at a time trains the
opposite habit. So the sequencing axis isn't concrete→abstract, it's **away from operand sizes
large enough to invite counting** (the ones a child is likely to count rather than see at a
glance drop out first), and *speed itself* — not "fluency on a fact," measured some other way —
should gate how much of the pip/emoji presentation stays in the mix at all. *(Concrete–
Representational–Abstract still applies to subitizing itself — recognizing "6 dots" instantly
is its own representational skill — just not to the addition problem being solved here; Clements
& Sarama, subitizing. See §17.6.)*

### 17.6 Speed & instant recognition — *stated future direction, added 2026-09-18, safety-first revision*
This game's actual target skill is **fast, automatic recall** — `3 + 4 = 7` retrieved instantly,
not worked out. Phase 1 as built (and 17.1/17.3/17.5 as originally written) leaned on
concept-teaching techniques aimed at a different problem — a child still learning what addition
*is*. Reoriented around fluency — but every idea below is subordinate to one constraint:

> **Non-negotiable constraint:** nothing here may ever present a child's own normal response
> time as slow, wrong, or a shortfall. A 7-year-old counting on fingers isn't failing — that's
> what the skill being built normally looks like mid-way through. Speed is *rewarded* when it
> happens; its absence is met with silence and full credit, never a penalty, a broken-combo
> visual, a losing state, or any comparison to a number the child never chose. Get this wrong and
> the feature actively teaches math anxiety, undoing §17.2 entirely — a worse outcome than never
> building it.

That constraint means measurement and reward can't be designed in one step — it has to be two,
in order, with nothing skipped:

1. **Baseline first, with zero visible effect on the game — shipped 2026-09-18 (§11).** Every
   problem's first-attempt latency (problem shown → ✓/Enter, §5/§6) is recorded silently — no
   on-screen timer, no countdown feel, nothing the child can perceive as being tested — tagged by
   presentation (§4) and operand size, reviewable on the stats screen (§11) over a rolling 30
   days. This is *only* measurement: nothing reads this data during play, and it affects no
   scoring, difficulty, or reward yet. The goal at this stage is purely learning *this specific
   child's* normal range at each difficulty tier (§3's sum ramp) — every kid's baseline will
   differ, and guessing one is the mistake this whole item exists to avoid. Steps 2 onward below
   remain unbuilt — collecting the data isn't itself permission to act on it yet (§16).
2. **"Fast" is then defined relative to that baseline — never a fixed number.** Once real data
   exists, "improvement" means beating *this child's own* recent median by some small margin: a
   personal, moving target that ratchets up gently only as their actual times drop, and eases
   back down on an off day or a harder tier rather than staying pinned to a target they've fallen
   behind. No universal threshold (a guessed "1.5 seconds," say) should ever gate anything — see
   the constraint above.
3. **Reward fast-and-correct; never penalize slow-and-correct.** Once a personal baseline exists,
   a streak/combo/score bonus can light up extra when an answer beats it — but a correct answer
   slower than baseline lands exactly as it does today: full credit, full celebration, nothing
   withheld, nothing flagged. The reward is strictly additive, never a tax on the normal case.
4. **A speed-driven core mechanic (17.1) still can't let "slow" feel like losing.** A chase where
   the gap visibly closes, or a beat visibly missed, risks becoming exactly the pressure this
   constraint rules out. Any such mechanic's "not fast" outcome has to land as neutral — no combo
   bump, nothing more — never as caught, behind, or any losing-state visual. The good feeling
   should come from beating your own pace, not from what happens when you don't.
5. **Retire counting as a viable strategy.** Any presentation solvable by counting individual
   items works against automaticity (§17.5) — keep pip/emoji groups only where the pattern is
   small enough to be subitized at a glance, not counted one dot at a time.
6. **Fold latency into adaptivity (§17.3) as more reps, never as a marked mistake.** A
   correct-but-slow answer can resurface for spaced practice the same way a miss might — but only
   in the backend selection logic. Nothing child-facing should ever say "too slow"; a resurfaced
   fact should look and feel identical whether it came back because it was missed or because it
   was merely slow.

Calibrating any of this (the margin in step 2, the grace period in step 1) needs real play data
from actual sessions, not a number picked in the abstract — which is exactly why step 1 has to
ship, run, and be reviewed well before step 2 or anything reward-shaped is built.

### Strengths to preserve from Phase 1
Multiple representations of quantity (symbolic / set-based / subitizable pips), immediate
feedback (200 ms), multimodal input, low cognitive load, an explicit two-step confirm (type
then ✓, §5/§6) that keeps the wrong-answer signal clean of fat-finger noise, and the never-skip
principle (once scaffolded per 17.2).
