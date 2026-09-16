# Addition Game — Specification

**Purpose:** A web game that helps a 7-year-old practice single-digit addition.
**Status:** Clarified and locked, ready to build.
**Last updated:** 2026-09-16

> **Scope:** Sections 1–14 are **Phase 1 — build now**. Section 15 is **Phase 2 — deferred, do not build now** (learning-design upgrades captured for a later version).

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
- **Keyboard digit keys** are also accepted — input is **global** (no field to focus).
- The answer appears **inline in the equation** (`3 + 5 = ▏`) with a **blinking caret** when
  empty — deliberately *not* styled as a text-input box.
- **No submit button, no backspace** — answer is auto-checked (see §6).

> **Known trade-off:** with no backspace, a mis-tap cannot be corrected — it resolves as
> a wrong answer and the same problem is re-shown. Acceptable per current design; revisit
> if fat-finger errors prove frustrating.

---

## 6. Answer checking (auto-check with prefix logic)

The entered value is evaluated against the **known** correct answer after **every tap**:

- Entry **equals** the answer → **correct**.
- Entry is **`1`** *and the correct answer is 10, 11, or 12* → wait for the second digit.
- **Anything else → wrong immediately.**

This makes a wrong single-digit guess (e.g. entering `6` when the answer is `7`) fail
instantly, instead of forcing a pointless second tap.

**Correct path timing:** on a correct entry, wait **200 ms** so the child sees their
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
  scaffolding in §15.2.)*

---

## 8. Sound

Synthesized in-browser (Web Audio), unlocked on the first user tap (mobile autoplay policy):

| Event | Sound |
|-------|-------|
| Key / tray press | click |
| Correct explosion | pop / party |
| Wrong answer | ding-ding |
| A snake-easter-egg trophy touch (§13) | ding (same two-tone chime as the Space theme's key press) |

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
  (by tap, or by the snake easter egg in §13) **without the rest re-packing/shifting** —
  positions are read for every trophy *before* any of them is pinned, so pinning an early one
  can't reflow (and bunch up) the ones read after it.
- **Trophies become tappable** once the layout is frozen: tapping one bursts it into **30 stars**
  at its position and removes it. The **last remaining trophy** bursts bigger instead — **~60**
  larger stars plus a brief **screen shake** — as a small finale (skipped under
  `prefers-reduced-motion`, which still keeps a smaller star burst).
- Also show the hint **"Tap to play again"** and a **big orange "Play" button**.
- **Restart:** the Play button **or any tap/key not on a trophy** starts a new session (stars,
  difficulty, and longest-streak all reset), returning first to the theme picker (§10) — which
  also stops the snake easter egg (§13) if one is running.

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

**Trickiest problems:** the top 10 most-missed `a + b` combinations, each with a mistake
counter, sorted by frequency. A wrong *submission* counts as a mistake, so missing the same
problem twice before getting it counts as two.

**Reset:** a small, de-emphasized "Reset stats" link sits well below the Close button — spaced
apart deliberately to avoid an accidental tap — and opens an inline **confirm / cancel** prompt.
Nothing is deleted until the destructive option is explicitly confirmed.

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
- **Tapping a prize** plays one random reaction from a set of ten (tada, shake, jump, rotate,
  wobble, bounce, pulse, flip, swing, heartbeat) plus a tap sound — just a fun, replayable touch,
  no game effect.
- A **← back button** (top-left) returns to the theme picker.
- **Empty state:** "Finish a game to win your first prize!" if none are collected yet.

---

## 13. Win-screen snake easter egg

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
  trophy a segment overlaps **shrinks to scale 0 over ~0.125s with a "ding"** and is removed —
  distinct from (and simpler than) the tap-to-pop celebration in §9. This can only happen once
  the win screen's trophy layout has been frozen (§9), so it never fights the staggered reveal.
- **Shrinking away:** after crawling at full length for **20s**, the snake starts shedding one
  tail block roughly every 400ms until it's gone (~3s to fully vanish) — it doesn't crawl
  forever.
- **Stopping:** leaving the win screen (Play button, or any tap/key that returns to the theme
  picker, §9) stops the snake immediately, wherever it is.
- Skipped entirely under `prefers-reduced-motion`, consistent with the other particle-effect
  rewards (§7).

---

## 14. Open items / future tweaks

- No backspace under auto-check (§5).
- A **linear difficulty ramp** is now in Phase 1 (§3, sum 5→12); the **adaptive, fact-tracking**
  version remains Phase 2 (§15.3).

---

## 15. Phase 2 — Learning design (deferred, do not build now)

Upgrades to make the math *emerge from play* rather than be a toll paid to reach a reward.
Ordered by leverage toward that goal; each is paired with the theory it draws on.

### 15.1 Make the numbers have a purpose (intrinsic integration) — *highest leverage*
The Phase 1 game is a **drill with juice**: solve the sum → get the fireworks. The math is
the toll, not the play. Convert it to an **endogenous** design where manipulating numbers
*is* the fun act — e.g. feed a creature exactly N berries, build a tower to a target height,
fill a jar to a line. The addition becomes something you *do to get what you want*.
*(Malone & Lepper; Habgood & Ainsworth, intrinsic integration.)*

### 15.2 Scaffold the second wrong attempt — *highest safety priority*
Phase 1 re-shows the identical problem until correct, with no teaching — a recipe for math
anxiety and learned helplessness when the child genuinely doesn't know the fact. Keep the
never-skip rule, but on the **second** miss, *help*: reveal pips under the digits, animate a
count-up, show a number line, or decompose (`8 + 7 → 8 + 2 = 10, then +5`). Reframe errors as
information, not verdicts. *(Dweck, growth mindset; Seligman, learned helplessness.)*

### 15.3 Adaptivity + fact-memory
Flat random difficulty prevents flow and a felt sense of progress. Track which addend pairs
the child misses, resurface them (spaced retrieval / testing effect), and let difficulty drift
upward as accuracy and speed rise. *(Csikszentmihalyi, flow; Roediger, testing effect.)* The
mistake-frequency tracking already shipped in §11 is the raw data this would build on.

### 15.4 Surface competence + one autonomy choice
Give a visible mastery signal beyond a single session (levels, cumulative progress) and at
least one real choice (choose between two problems, or a sub-mode). *(Deci & Ryan,
Self-Determination Theory — competence + autonomy.)* *(World/theme selection already landed in
Phase 1, §10, and the stats screen in §11 already gives a persistent competence signal; this
item is about deeper in-game autonomy.)*

### 15.5 Sequence the representations (don't randomize blindly)
The three formats are concrete → abstract (pips/emoji → digits) and map onto how number sense
develops. Instead of random order, **lead concrete and fade toward abstract** as fluency on a
fact grows. *(Concrete–Representational–Abstract; Clements & Sarama, subitizing.)*

### Strengths to preserve from Phase 1
Multiple representations of quantity (symbolic / set-based / subitizable pips), immediate
feedback (200 ms), multimodal input, low cognitive load, and the never-skip principle
(once scaffolded per 15.2).
