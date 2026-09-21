# Addition Game — Specification

**Purpose:** A web game that helps a 7-year-old practice single-digit addition, with a stated
long-term direction (§17.6) of building **fast, automatic recall** — not just eventual
accuracy. The child already understands addition; the goal is fluency, not concept-teaching.
**Status:** Clarified and locked, ready to build.
**Last updated:** 2026-09-19

> **Scope:** This file is **what the game is** — Sections 1–15 and **§18**, all **Phase 1, built**.
>
> **Everything not yet built lives in [`addition-game-future.md`](addition-game-future.md)**:
> the Phase 2 learning-design backlog (§17), the open items and tweaks (§16), and a gap analysis
> of the shipped game against both. §16 and §17 keep anchor headings here so the two files' ~39
> cross-references still resolve — the numbering is deliberately unchanged.
>
> **Two modes:** the game now ships an **Easy** mode (the original game, §1–§15 exactly as written)
> and an opt-in **Fast** mode (§18) that adds a visible timer and a speed reward. Everywhere below,
> §1–§15 describe **Easy** mode; **§18 is the single place that lists every way Fast mode differs**,
> and the sections it touches carry a pointer to it.

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

> **Fast mode (§18):** no ramp at all — the sum is a flat **6–12** for every problem, from the
> first one, and neither a wrong nor a correct answer moves it.

---

## 4. Presentations

Each problem picks **one of three presentations at random** *(Fast mode instead lets the child
pick, before every single problem — §18.3)*, subject to the per-game allowance below:

1. **Digits** — `2 + 3 =`
2. **Emoji groups** — one repeated emoji per operand, e.g. 😄😄😄😄 + 😄😄 =
   - **Cap: 6 emoji per operand**, the same rule and the same reason as pips below — past six,
     a pile stops being read at a glance and starts being *counted*, which trains the habit
     the game exists to replace (§17.5 / §17.6 step 5). Added 2026-09-19; emoji operands
     previously ran to 9 while pips were already capped.
   - **Emoji category matches the active theme (§10)**, so the pictures feel like they belong
     to that world instead of being generic:
     - **Nature** 🌳 draws only from the nature set (flowers, leaves, butterflies…).
     - **Animal** 🐔 draws from fruit + animals + birds.
     - **Space** 🚀 draws from a dedicated space set (rocket, planets, moon, alien…).
     - **Classic** 👦 draws from the full pool (animals, fruit, nature, birds, household items) —
       it has no strong theme, so it keeps the original variety.
3. **Pips** — dice faces or domino tiles, e.g. `.` + `..` =
   - **Cap: 6 pips per operand.** If either operand is > 6, re-roll the pair for this
     problem.
   - Groups are laid out on a small grid that never wraps past **2 rows**, with the glyph
     size shrinking as the count grows — so a 6-item group can't push the keypad off
     the bottom of the screen on a narrow phone.

> **Note:** the cap of 6 per operand applies to **both object presentations** (emoji and pips)
> and to neither digits — there is nothing to count in a "9". It allows sums up to `6 + 6 = 12`,
> which matches the ramp's top and Fast mode's ceiling, so **all three presentations still cover
> the full range** at max difficulty; digits alone can show a single operand above 6.

**Object-presentation allowance: 7 per game** *(added 2026-09-19)*. Across a whole game, at most
**7 of the 10 problems** may use an object presentation — **pips and emoji counted together**.
Once that allowance is spent, **every remaining problem is digits**, so a game always finishes on
plain symbols and can never be played end-to-end without reading numerals.

- **Easy mode** stops rolling pips/emoji and picks digits for the rest of the game.
- **Fast mode** stops *offering* them: the "Pick how to see it!" picker (§18.3) shows **Digits
  alone** once the allowance is gone. The overlay still appears and still waits for a tap, since
  that tap is what starts the water bar (§18.4) — the child is never put on the clock before
  they're ready, even when there's only one button.
- The allowance **resets at the start of every game**, like the anti-rut rotation (§18.3).
- Where the two rules disagree, the allowance wins: it's a hard rule, while the anti-rut rotation
  is only a nudge, so the rotation is **skipped** whenever honouring it would leave nothing to
  offer.

  > **This guard is defensive, not load-bearing at current settings.** With a 10-problem game, a
  > 7-problem allowance and a 5-in-a-row lockout, an empty picker **cannot** happen: locking
  > Digits out needs 5 consecutive digit picks and spending the allowance needs 7 object picks,
  > and `5 + 7 = 12 > 10`, so a game has no room for both. Verified by replaying every reachable
  > Fast-mode game (40,576 sequences) — zero empty rows.
  >
  > The margin is only **2 problems**, though. Drop the allowance to **5 or lower** (or raise
  > `RUN_LIMIT`, or shorten the game) and the stall becomes genuinely reachable — which is why
  > the guard stays.

*Why:* objects can be **seen** rather than recalled, so a game made mostly of them can be
completed without ever practising the fact. This is a blunt, non-adaptive first step toward
§17.5/§17.6 step 5 — "how much of the pip/emoji presentation stays in the mix at all" — which
eventually wants to be gated on *speed* rather than a fixed count.

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

**What this guarantees for the stats (§11).** Because nothing is evaluated before ✓/Enter, an
uncommitted mis-tap is invisible to every counter in the game: **accuracy**, the per-game score,
the "trickiest problems" log and the response-time log all move only on a committed answer. A
child can type, clear and retype as often as they like at no cost. *(Confirmed by inspection
2026-09-19: the wrong-answer path has exactly one call site, inside the submit handler, and the
digit and clear handlers touch no stats at all.)*

---

## 7. Feedback & animation

### Correct
- **Association pass (added 2026-09-19).** The instant the answer is committed, each operand
  gains the **same quantity hint** the second-miss scaffold uses (§7 "2nd wrong", step 0):
  **pips under a numeral**, **the numeral under pips or an emoji pile**. The point is to tie the
  *shape* to the *digit* while the child is looking at a win — a number and its quantity seen
  together, at the moment it feels good.
  - It appears **after the commit**, with input already locked, so it can never serve as a
    shortcut to the answer; and it carries no judgement, appearing identically on a first-try
    answer and on one that took three attempts (§17.6's constraint).
  - Consistent with §17.5: every face shown is within the subitizing cap (7/8/9 arrive as two
    dice), so this trains *recognition*, not counting.
  - It clears with the problem when the next one is generated.
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

> **Fast mode (§18.5)** inserts a **second flying star** into this sequence when the answer beat
> the water bar: the cake 🎂 lifts off the start of the bar and lands on the same slot **250 ms
> after** the regular star smashes home. A **streak reward waits for that landing** before it
> fires, so a candy rain or a fly-by never plays over the cake's flight — and the next problem is
> held back by the cake's flight *plus* the reward's full length, not the two overlapped.

### Wrong
- **Shake** the on-screen items.
- Flash a centered **thinking face 🤔 or question emoji ❓** (randomly chosen).
  *(Replaces the earlier sad/angry/“X” idea — deliberately gentler for a young learner.)*
- **1st wrong:** after **1 second**, reset the input to empty and **re-show the exact same
  problem in the exact same presentation**. No star awarded.
- **2nd wrong (same problem):** guided correction so the child enters it themselves —
  0. **Quantity scaffold (§17.2, added 2026-09-19).** Before anything is revealed, a hint appears
     **under each operand**, showing that same number the *other* way, so the fact can be worked
     out rather than only be read off. Nothing already on screen changes — help is **added
     beneath** the problem, which stays exactly as it was.
     - **Digits →** countable **pips** under each numeral. A die face only reaches 6, so **7, 8
       and 9 appear as two dice side by side** that add to it — split **5+2, 5+3, 5+4**, anchored
       on the 5 (the X face) so the pair reads as "five and some more".
     - **Pips →** the **numeral** under the die face, giving the face a name.
     - **Emoji →** the **numeral** under the pile, same reason.
     The hint **stays up** through the reveal and the re-ask below, so it's still there while the
     child types — and clears with the problem when the next one is generated. It is purely
     additive help: no penalty, no "too slow", nothing withheld (§17.6's constraint).
  1. **Reveal** the correct answer (green, **"ta-da!" pop** + sparkles + fanfare) and **keep it on
     screen**.
  2. **Wait 500 ms.**
  3. **Flash the correct key(s)** on the keypad, demoing the full sequence **twice** — for a
     two-digit answer (10, 11, or 12) that's the first digit's key then the second, repeated (so
     `11` flashes the `1` key four times, `10` flashes `1,0,1,0`, `12` flashes `1,2,1,2`).
  4. **Reset the exercise:** clear the answer and re-ask the **same** problem — the child types it.
  - The re-ask is a **fresh attempt**: wrong-count resets, and a correct entry now **earns the
    star**. (If a twice-missed problem should never award a star, gate this — currently it does.)
  *(Prevents the child getting trapped on a fact they don't know. With step 0 this is now
  §17.2 proper, not just a light version of it: the child is helped to work the fact out before
  being told it.)*

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
| Star fills (including Fast mode's bonus cake landing, §18.5) | star "ting" |
| Flipping the Easy/Fast toggle (§18.1) | ding on success; the wrong-answer ding-ding when Fast is still locked |

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
  *(Fast mode draws from its own separate 60-emoji pool and appends one 🎂 trophy per speed
  bonus earned — §18.7.)*
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
**🚀 bounces** (space), **🐔 shakes** (animal). The picker also carries the **Easy/Fast difficulty
toggle** (§18.1), the 📦 prize box (§12), the mastery badge (§13), and the 📊 stats link (§11).

A theme changes the **background**, the **keypad + Play button colors**, the three **streak-reward
visuals**, the **emoji-presentation category** (§4), and the **key-press sound**. The **problem
card stays white with navy numbers** in every theme for legibility; the **prize badges** (§7) use
each theme's own reward emojis; on dark themes the empty-star colour is lightened for contrast.
Background/button motion is minimised under `prefers-reduced-motion`.

**Fast mode is not a theme.** All four themes stay available in both modes and look identical
in-game; Fast mode only adds a field of **falling 🚴 bikes over the theme-picker screen itself**
(layered on top of that screen's own background, never replacing a theme's), so the mode the next
game will start in is visible at a glance. Skipped under `prefers-reduced-motion`.

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

**Split per difficulty.** Every stat, chart, log, and the mastery badge below is tracked
**separately for Easy and Fast** (§18.6) — two entirely independent histories in one storage blob.
The stats screen carries its own copy of the Easy/Fast toggle at the top, which switches *which
mode's* numbers are shown (it's the same single setting as the picker's, not a second one), and
"Reset stats" clears **only the mode currently shown**.

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
| Accuracy | correct ÷ (correct + wrong) across all games. **Only committed answers count** (§6) — a wrong digit typed and cleared, or any tap never confirmed with ✓/Enter, has no effect on this or any other stat |
| Longest streak | best consecutive-correct streak ever reached |
| Total play time | sum of finalized sessions (see definition above) |
| Average / shortest / longest session | over finalized sessions |
| Days played | distinct calendar days with at least one session (today counts the moment a game starts, without waiting for the session to end) |
| Favorite this week | theme played most in the **last 7 days** (not an all-time tally, so it tracks current taste rather than getting stuck on whichever theme had an early lead) |

**Charts** (hand-drawn inline SVG, no charting library):
- **Last 30 games** — bar chart of the most recent games' scores.
- **Last 30 days** — line chart of each day's average score across the last 30 calendar days
  (a day with no games leaves a gap in the line).
- **Getting faster? (last 30 days)** — line chart of each day's **median time per correct
  answer**, the only chart that tracks the game's actual goal (fluency, §1) rather than
  accuracy. Added 2026-09-19. Three deliberate choices:
  - **Its own chart, not a second line on "Last 30 days."** Milliseconds and a 0–10 score share
    no axis, and an unlabelled sparkline carrying two units is unreadable.
  - **The y-axis is inverted — faster sits higher** — so "the line is going up" means the same
    thing here as on every other chart on the screen. Captioned *"Higher is faster"* so the
    inversion is never a guess.
  - **Scaled from 0 to the slowest day in view**, so the shape is honest about magnitude (a day
    twice as slow sits at half the height) instead of stretching to fill whatever range happens
    to be present. A footnote gives the best and slowest day in seconds.

  Each game stores its own median alongside its score, so this is a genuine trend rather than a
  re-slice of the rolling 30-day log below. It needs **two** separate days of play before it
  draws anything; one day shows "play on another day to see a trend." Games recorded before
  this shipped have no time attached and are simply skipped, as is any game with no correct
  first attempts.

**Trickiest problems (last 7 days):** the top 10 most-missed `a + b` combinations, each with a
mistake counter, sorted by frequency. A wrong *submission* counts as a mistake, so missing the
same problem twice before getting it counts as two. Scoped to the **trailing 7 days** (not
all-time) so a rough patch early on, or a fact since mastered, doesn't sit pinned at the top
forever — same reasoning as "Favorite this week" above. Backed by a timestamped log
(`{a, b, t}` per miss) that self-prunes to the 7-day window on every write.

**Response time (last 30 days):** §17.6's baseline-measurement step — see that section for the
full reasoning and the non-negotiable safety constraint it operates under. In short: every
problem's **first attempt** (retries after a miss don't re-log) has its latency recorded — time
from the problem appearing to ✓/Enter being pressed — tagged with its presentation (§4), its
larger operand, and **whether that attempt was right**. Wrong first attempts are still logged
but are **excluded from every response-time figure shown or used**, because a fast wrong guess
and a fast correct recall are the same number of milliseconds and pooling them answers neither
question. (Added 2026-09-19; entries recorded before the flag existed are counted as correct
rather than discarded.) This is **purely passive**: no timer, countdown, or
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

**Reset:** a small, de-emphasized "Reset stats" link — affecting only the mode on screen, per the
split above — sits well below the Close button — spaced
apart deliberately to avoid an accidental tap — and opens an inline **confirm / cancel** prompt.
Nothing is deleted until the destructive option is explicitly confirmed — including the mistake
and response-time logs above, which live in the same storage.

---

## 12. Prize box & collectible prizes

Reachable via a **📦 button** on the theme-picker screen (§10), below the world-select grid.
Stored **locally on-device only** (its own `localStorage` key, separate from stats — §11's
"Reset stats" never touches it), so prizes are permanent unless a dedicated reset is added later.
The **one** thing that ever removes a prize is the child's own four-of-a-kind merge (below), which
spends four duplicates to buy one new prize.

**One box for both modes** (unlike stats, §11, which split). A Fast-mode prize is drawn from its
own glyph pool and carries a small **🚴 badge** in the tile's top-right corner, so the shelf reads
as one growing collection while still telling the two apart — see §18.7.

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
- **A scroll gutter down the right edge** *(added 2026-09-20)*. A tile swallows its own
  `pointerdown` — it has tap games to play (below) — so a drag that starts on one can't scroll the
  shelf, which made a full shelf awkward to get through without setting something off. A strip of
  the scroll area on the right is therefore kept **permanently free of tiles**, wide enough for a
  thumb, so there is always somewhere to grab.
- **Dark-wood end bars, top and bottom** *(added 2026-09-20)*. The shelf runs between two dark
  plank rectangles — the ends of the box itself — so the list visibly stops at a hard edge instead
  of fading off the screen. The bottom plank absorbs the safe-area inset so it reaches the
  physical bottom edge on a notched phone. Each plank carries a **drop shadow on its inner face
  that shows only while there is more list that way**, so a *bare* plank is the signal "this
  really is the top / the bottom of your prizes".
- **The page never pull-to-refreshes.** `overscroll-behavior:none` on the document and `contain`
  on the shelf stop a flick past either end from chaining out to the browser, and a touch that
  starts exactly at an end nudges the shelf one pixel in first — older iOS Safari otherwise reads
  that drag as a page drag and reloads the game mid-visit.
- Prizes appear **in the order they were earned** (not grouped by type) — chronological, since
  storage is append-only.
- Each prize is two nested elements: a **fixed-size outer cell** (its grid slot — never itself
  animated or moved) containing an **inner emoji face** that plays the entrance pop and tap
  reactions below. Keeping the two separate means a tile reacting to a tap never shifts its
  neighbors.
- **Tapping a prize** plays one random visual reaction from a set of ten (tada, shake, jump,
  rotate, wobble, bounce, pulse, flip, swing, heartbeat) — a fun, replayable touch in its own
  right. That reaction is also the *first* rung of both games a tap can feed: the Fast-mode combo
  and the merge game, both below.
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
- **Hard-mode prizes build combos; easy-mode prizes don't.** This is the one way the kinds of
  prize behave differently on tap, and it exists so a Fast-mode prize is visibly *worth more* than
  an easy one once it's sitting on the shelf. Tapping the **same** hard tile again within
  **1.2s** escalates:
  1. **Tap 1** — exactly the easy-mode reaction: one random visual of the ten, plus that prize's
     own sound. The two modes are indistinguishable until a combo is actually under way.
  2. **Tap 2 — charged.** One *fixed* wind-up motion (rear back, shudder, swell to 1.14×) plus a
     rising tone layered over the prize's own sound. The tile then **holds** a pulsing warm glow
     at that larger size until the window lapses, so it visibly has something stored up.
  3. **Tap 3 — eruption.** The face compresses and punches out past the tile's bounds, a deep
     boom plays, a shockwave ring expands from the tile, and a **full-screen finale matched to
     that specific prize** fires. The combo then resets to zero, so a fourth tap starts again
     at tap 1.

  Taps 2 and 3 are deliberately **not** random (unlike tap 1): the escalation has to be
  *learnable*, so a child can discover on their own that a third tap sets the thing off. A combo
  left hanging past the window simply cools off — the glow clears and the face deflates back to
  normal size rather than snapping — so a tile is never stuck charged.
- **Six eruption kinds**, each of the 60 hard glyphs mapped to the one that matches what it *is*
  — the same "family" approach the tap sounds use, rather than 60 bespoke finales:
  **rain** (falls from above: 🌋 throws 🔥, 🌊 throws 💧, 👑/🗝️/🧱 throw themselves),
  **sweep** (one giant glyph crosses the whole screen — for prizes that move under their own
  power: 🐉 🦈 🦅 ☄️ 🐆 🪃 🏴‍☠️),
  **swirl** (spirals outward from centre — anything that turns: 🌪️ 🔮 🧭 ⏱️ 🃏 🪄),
  **flash** (a tinted wash over the whole box plus outsized glyphs — things that *are* a burst of
  light or noise: ⚡ 🚨 🔋 🔱 📯 🧿 🕹️),
  **quake** (the whole shelf shudders **as one unit**, so tiles still never move relative to each
  other, while heavy glyphs thud out of the tile: 🦖 🦏 🧱-likes, weapons, 🥊 🎳 🏔️), and
  **burst** (a radial blast out of the tile — the generic finale and the fallback for any glyph
  with no entry).
  The particle glyph is often **not** the prize itself, because what a thing *throws* reads better
  than copies of the thing: 🌋 rains fire, 🌊 rains water, 💎/🏆/🪄 throw ✨.
- **Reduced motion** (§15) still gets the full escalation by ear and on the tile — sound, wind-up,
  punch and shockwave ring — but the screen-wide particle finale is skipped.
- Eruption effects render in their **own layer above the shelf** that never intercepts a tap, and
  are cleared whenever the box opens or closes, so a finale never bleeds into the next visit.
- A **← back button** (top-left) returns to the theme picker.

**The four-of-a-kind merge game (both modes).** Added 2026-09-20; extended to Fast-mode prizes the
same day. Collecting duplicates of the same prize is otherwise dead weight on the shelf, so
duplicates become a *currency*: four of a kind trade up into one brand-new prize.

1. **Tap a prize** → a **count badge** appears in its corner reading **1**. A group is now
   building. (Top-right normally; on a Fast tile it sits **top-left**, because the 🚴 badge already
   has the top-right corner.)
2. **Tap another tile showing the same emoji** → **2**, then **3**.
3. **Tap a fourth** → the group completes (no badge — it goes straight to the merge).

- **Four distinct tiles, not four taps.** Re-tapping a tile already in the group still plays its
  reaction and sound, but the count doesn't move. The child must actually *own* four copies —
  that is the whole game.
- **A group matches on emoji *and* mode.** 🦖 is the one glyph in both pools (§16), and an easy 🦖
  must not be spendable against a Fast one — the trade would have no way to pick which pool to
  reward from.
- **Fast prizes play both games at once.** The combo (§12 above) counts taps on **one tile**; the
  merge counts **distinct tiles** of one emoji. They never collide: hammering a single tile still
  charges and erupts it, while working across four copies still builds a group. A tile that enters
  a merge has its combo dropped first, so a charged glow never outlives the tile it meant
  something on.
- **A group drops** — badges and all — on any of: a tap on a prize that doesn't match on **both**
  counts (the count restarts at **1** on the new one), **10 seconds** of silence (long, because
  finding the next copy means scrolling the shelf), or **leaving the box**.

**The merge.** The three other tiles **fly across the shelf into the fourth** — transform and
opacity only, so nothing they pass nudges its neighbors — then are removed. The fourth tile, the
**last one tapped**, stays exactly where it is and becomes a **🎁 present**, so it is obvious where
the reward landed. The present:
- carries a **pulsing glow pooling underneath it**, and is lifted above its neighbors so the glow
  is never half-painted-over by the next tile along;
- is **already sized to the reward inside it** (see below), previewing what is coming;
- **breathes** gently in place until it is tapped;
- **keeps the 🚴 badge** if it came from a Fast group — the present is literally the last tapped
  tile, badge and all, so the trade visibly stays inside that mode.

**Opening the present.** Tapping it bursts it open — it shivers, squashes, then blows wide, and at
the animation's widest point the 🎁 **becomes the new prize**, with sparkle particles and that
prize's own tap sound. The new prize is drawn at random from **that group's own pool** — the easy
60-emoji pool (§9) for an easy group, the Fast pool (§16) for a Fast one — **excluding the emoji
just spent**, so a merge always trades *into something else*. It lands in the present's slot and is
immediately a normal prize: tappable, able to start a group of its own, and — if it came from a
Fast group — stored as a Fast prize, so it keeps the 🚴 badge, its own hard-mode tap sound and its
eruption. **A merge never changes which mode a prize belongs to.**

**What it costs.** The trade is **permanent and net −3**: the four entries are deleted from storage
and the one new prize takes the last-tapped one's position, keeping the rest of the shelf in its
earned order. Two rules protect the child here:
- **Nothing is written until the present is actually opened.** A present left sitting — because
  the child wandered off or went back to the picker — costs nothing; all four prizes are still
  there on the next visit.
- **The reward inherits the largest of the four**, rainbow ring and all (four 1×'s → a 1×, and
  four perfect 1.5× tiles → a perfect 1.5× tile). A merge is never a downgrade. Merged entries
  store their **size directly** rather than a score, since they were never played for — the one
  kind of prize whose tile size isn't derived from a game result.

**Only one present at a time.** While a present is pending, tiles still react to taps but no new
group builds. This is what keeps the trade safe: a group holds storage *positions*, and the
pending write is about to shift every one of them.
- **Empty state:** "Finish a game to win your first prize!" if none are collected yet.

---

## 13. Mastery badges

Round badges sit next to the 📦 button on the theme-picker screen (§10), showing progress that
persists across sessions — a visible mastery signal beyond any single game (directly addresses
§17.4's competence-signal recommendation). **Easy mode shows one** (accuracy); **Fast mode shows
two**, accuracy and speed side by side.

### 13.1 Accuracy badge (both modes)

Shows a **7-day precision** signal.

- **11 emoji tiers:** 🪨🧱🪙🔮💍🎖️🥉🥈🥇💎, spanning **50%–100%** 7-day precision in even
  **5-point bands** (below 50%, or no games in the trailing 7 days, shows the rough stone at 0%
  fill), plus a bonus **👑** reserved exclusively for an **exact** 100% — zero wrong submissions
  in the window, not just rounding up to it.
  - *Re-themed 2026-09-20.* The ladder used to run 🐌🐔🐢🐝🐷🐱🐶🐄🐻🦖🏆 — a **speed** metaphor
    driving an **accuracy** number. A child reading the snail as "you are slow" was reading it
    wrong, and the confusion got worse once speed became a tracked, rewarded thing (§18). A
    rough-stone-to-crown-jewel ladder says *flawless*, which is what accuracy measures, and it
    frees the movement imagery for §13.2.
- **Precision** reuses the same correct ÷ (correct + wrong) formula as §11's all-time Accuracy
  stat, scoped to games finished in the last 7 days — and, like every other stat, **to the
  currently selected mode** (§11, §18.6). Flipping the toggle re-reads the badge against that
  mode's own 7 days, so a strong Easy record never dresses up a shaky Fast one.
- **Arc:** a thin gold ring fills across each tier's own 5-point span, so every **0.5%** of
  precision moves the arc a fixed **10%** (10 half-percent steps = one full tier).
- **Emoji size** scales evenly from **1.0×** (rough stone) to **2.0×** (crown) across the 11 tiers.
- **Crown tier** swaps the gold ring for a **spinning rainbow ring** — colors cycle in place,
  the ring itself never rotates — the same technique as the perfect-game prize-tile ring (§12).
- **Next-badge preview:** tapping the badge dings and pops up a speech-bubble balloon (bounce-in,
  ~0.45s) showing the **next tier's emoji** and the precision needed to reach it (or "You're a
  champion!" once at the crown). A second tap, or **3 seconds** of no input, pops it back down
  with a quick shrink-out. The "stay open" state is a plain CSS class rather than relying on an
  animation's fill-mode to hold its last frame, so the 3-second dwell can't be silently cut short.
- **Test mode:** a hidden developer shortcut for previewing every tier without grinding out real
  games — see §15 for how to enable it and what it unlocks (including a fast path to testing
  §14's snake).

### 13.2 Speed badge (Fast mode only) — *added 2026-09-20*

A second badge beside the accuracy one, shown **only in Fast mode**. Easy mode surfaces nothing
speed-related anywhere (§18.8), and that includes here — switching modes shows and hides it.

- **11 vehicle tiers:** 🚶🏃🛴🚲🛵🏍️🚗🚄✈️🛸🚀 — walking up to a rocket. The **bike sits at rung
  4**, which also gives Fast mode's cyclist somewhere to belong rather than appearing with no
  explanation (a child asked what it was for; see the companion file's G10).
- **Measured against the child's own starting pace, never a clock.** §17.6 forbids a guessed
  threshold, so there is no "answer within N seconds" anywhere in this. The badge compares the
  **median of their first 3 recorded games** against the **median of their most recent 3**
  (per-game medians come from §11's speed trend). The ladder tops out at **twice as fast as they
  began**.
- **Two safety properties, both non-negotiable (§17.6):**
  1. **The bottom rung is walking, not a snail.** A child who hasn't sped up sees something
     ordinary and neutral. There is no "you are slow" state on this ladder — the gain is floored
     at 1×, so a child who only ever got *slower* still sees the walker, never anything worse.
  2. **It ratchets.** A tier once reached is kept forever; a tired week cannot take a badge away.
     The stored best only ever rises.
- **Not enough data yet:** before 6 games with recorded times it shows the walker and its balloon
  reads "Play 6 games to start!".
- **Arc** is green rather than the accuracy badge's gold, so a glance tells the two apart. Tier
  rungs, emoji scaling (1.0×→2.0×), the top-tier rainbow ring and the tap-for-balloon behaviour
  are all identical to §13.1 — it's the same widget with a different ladder behind it.
- **The balloon never names a time.** It shows the next vehicle and "Answer a bit quicker!", or
  "Top speed!" at the rocket. Telling a child a number of seconds to beat is exactly what §17.6's
  constraint rules out.
- **Test mode:** Left/Right arrows walk the speed ladder, the way Up/Down walk the accuracy one
  (§15).

---

## 14. Win-screen snake easter egg

A **retro, block-based snake** (green segments + a head, reminiscent of classic console Snake)
occasionally crawls across the win screen (§9).

- **Trigger:** only after a **perfect game** (score 10, §11) — and even then, only a **1-in-3**
  chance in Easy mode, so it's a rare surprise rather than an expected reward. **Fast mode has
  its own variant:** **1-in-2** odds, a **bright red** snake instead of green, **twice as long**
  (16 blocks), and it crawls at full length **twice as long** (40 s) before shedding — matching
  that mode's higher stakes. Everything else below is identical in both.
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
  apart). **2 or more prizes touched at once** (easy with a dense field of trophies) queue their
  eat animations and play them **one at a time**, snake frozen the whole time — never
  overlapping. Movement (and new-touch detection) **resumes automatically** once the queue
  empties.
  - **The bulge is a travelling wave, not a row of separate pops** *(revised 2026-09-20; it was
    an instant snap plus a 500 ms deflate, and before that a 0.26 s pop)*. One lump moves from
    head to tail, and **the blocks around it swell too, on a sliding scale** — so a bulge in the
    middle of the snake visibly pushes out its neighbours on both sides, rather than one block
    inflating alone while the rest sit still.
    - **Two knobs**, both per block: **rise 280 ms** (normal size → full) and **settle 280 ms**
      (full → normal). Everything else follows from them. A block starts swelling once the wave
      is **3 blocks away** (`EAT_SPREAD`), which fixes the wave's speed at one block per
      rise ÷ spread ≈ **93 ms**; the settle then spans however many blocks it buys at that
      speed — 3 at the current numbers. Set a longer settle than rise and the lump simply grows
      a longer tail behind it.
      *(Both were 500 ms when the wave first shipped, which played too slow — 280 ms is that
      ÷ 1.8, chosen to land the whole swallow back at the pace the old per-block pop ran at.)*
    - **Driven in JavaScript, frame by frame, not by CSS keyframes.** The whole point is that a
      block's size depends on where the wave is relative to its *neighbours*, and a CSS
      animation can only ever describe one element on its own clock. The head's "O" mouth opens
      in step with the head's own swell, from the same loop.
    - **Timing:** one swallow takes **~1.2 s** (easy, 8 blocks) or **~2.0 s** (Fast, 16 blocks),
      and the snake is frozen for all of it, so several prizes touched at once still play
      strictly one after another. `EAT_RISE_MS` scales the whole effect — halve it and
      everything, wave speed included, moves twice as fast.
  - **The mouth sits below the eyes** *(fixed 2026-09-19)* — offset down by half its own height
    so it no longer overlaps them.
  - Implementation note: each body block is a positioning shell plus an inner "face" div, so the
    pop's scale animation never fights the shell's movement transform. Blocks are stacked
    **head-highest** *(fixed 2026-09-19)*: they're built head-first, so without explicit
    ordering the tail painted *over* the head and the snake looked like it was crawling under
    itself.
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

> **Moved to [`addition-game-future.md`](addition-game-future.md).** Section numbers here are
> deliberately unchanged — the spec and the companion file cross-reference each other ~39 times
> (`§16`, `§17.3`, `§17.6` and friends), and renumbering would break every one of them. This
> heading stays as an anchor; the content lives in the companion file.

---

## 17. Phase 2 — Learning design (deferred, do not build now)

> **Moved to [`addition-game-future.md`](addition-game-future.md)**, together with the gap
> analysis of what is actually built against it. Anchor kept for the same reason as §16 above.

---

## 18. Fast mode (the second difficulty) — *Phase 1, built 2026-09-19*

An opt-in second way to play, sitting beside the original game rather than replacing it. Where
Easy mode rewards **correctness alone**, Fast mode rewards **correctness *and* speed** — it is
§17.6's steps 2–3 made concrete, and the first thing in §17 to actually ship.

**The one rule everything here obeys (§17.6's non-negotiable constraint):** running out of time
**costs nothing**. A correct answer is a correct answer — full star, full celebration, full score,
identical in both modes. The timer only decides whether an **extra** reward is added on top. There
is no losing state, no lost star, no "too slow" message, and no comparison to any number the child
didn't set themselves.

Sections §1–§15 describe Easy mode; what follows is the complete list of differences.

### 18.1 Getting in: the Easy/Fast toggle

- A single **switch** — `EASY  [👦|🚴]  FAST` — sits on the **theme-picker screen** (§10) and
  again at the **top of the stats screen** (§11). Both render the **same one setting**; flipping
  either flips both.
- The button's face is the mode's own glyph (**👦** easy, **🚴** fast) and the active side's label
  lights up. Tapping it dings and switches; the choice applies to the **next game started**.
- **Gated:** Fast is locked until **at least one Easy game has been finished** (10 stars, §9).
  While locked the toggle is visibly dimmed, and tapping it plays the wrong-answer ding, shakes
  the button, and — on the picker only — shows the hint **"Finish an easy game first!"** for
  ~1.8 s. The gate isn't arbitrary: Fast mode's timer is calibrated from this child's own Easy-mode
  response times (§18.4), so it refuses to run until that data actually exists.
- **Not persisted.** The mode lives in memory only, so a reload starts back in Easy. Deliberate:
  the timed mode should be re-chosen, never inherited from a session someone forgot about.
- While Fast is selected, the theme picker rains **🚴 bikes** over itself (§10) — the one visual
  cue that the next game will be timed.

### 18.2 Numbers: no ramp, a flat floor

Easy mode's adaptive sum ramp (§3: start 5, +1 per correct, −2 per wrong) is **switched off
entirely**. Fast mode's sums are a flat **6–12** from the very first problem and never move — not
up on a correct answer, not down on a wrong one. Operands are still 1–9, and §4's 6-pips-per-operand
cap still applies to pip problems.

**Why no ramp:** the ramp exists to find the right *difficulty*; Fast mode's water bar (§18.4) is
already doing that job, continuously and per-child. Two adaptive systems pushing on the same
game at once would make neither readable.

### 18.3 The child picks the presentation — every single problem

Easy mode picks digits/emoji/pips at random (§4). Fast mode asks instead: before **every** problem
a full-screen **"Pick how to see it!"** overlay shows the three representations as buttons, each
with a **"?"** on it, and the problem isn't generated until one is tapped.

- The previews are **fixed samples** of each representation — a 5-pip die face, the digit **9**,
  a single 🍎 — never the upcoming problem's real numbers. The "?" makes it explicit that the
  problem itself is still hidden: the child is choosing a *format*, not peeking at an answer.
- **Anti-rut rotation:** picking the same representation **5 times in a row** drops it from the
  offered set for the next **5 problems**, after which it returns. Keeps practice varied without
  ever overriding the choice in the moment. The rotation resets at the start of every game.
- **Object allowance (§4):** once the game's 7 pips/emoji problems are used up, the picker offers
  **Digits alone** for the rest of the game. The overlay still shows and still waits for the tap,
  because that tap is what starts the water bar. The allowance outranks the rotation above, which
  is skipped rather than allowed to empty the row — a guard that current settings make
  unreachable anyway (§4 shows the arithmetic).
- The water bar (§18.4) is **hidden while the picker is up** and only starts once the problem is
  on screen, so deciding how to see it is never part of the timed window.

This is also the deeper **autonomy** choice §17.4 asked for and Easy mode never had — theme
selection is one choice per game; this is one per problem.

### 18.4 The water bar (the timer)

A horizontal bar sits **under the problem card**. It starts **full** for every problem and drains
**right to left** over a fixed duration, with the **🚴 biker riding the draining edge** (facing
left, the way it travels) towards a **🎂 cake parked at the start of the bar** — the prize he's
racing for. Run the bar dry and he reaches it: **biker and cake both vanish**, nothing won.

- **Constant within a game, personal across games.** The drain duration is one number, identical
  for all 10 problems of a game, and stored in its own `localStorage` key (a difficulty setting,
  not a stat — §11's reset never touches it).
- **First-ever value:** this child's **slowest** recorded Easy-mode response time (§11's 30-day
  latency log) **+ 2 s**, clamped to **2–20 s**; a fixed 7 s only if that data is somehow missing.
  Deliberately generous — the opening experience should be beatable, not a wall.
- **Between games** (never mid-game), the duration is nudged by how the finished game went:

  | That game's result | Next game's bar |
  |--------------------|-----------------|
  | Bar **never** emptied (all 10 answers beat it) | **×0.85** — drains faster |
  | Bar emptied on **more than half** the problems (6+ of 10) | **×1.15** — drains slower |
  | Anything in between | unchanged |

  Always re-clamped to **2–20 s**. A ratchet that eases back down on a bad run, not just up.
- **Retries keep draining.** The bar is tied to when the *problem* first appeared, so a wrong
  answer (§7) doesn't refill it — the same problem re-asked is the same problem. It refills only
  for a genuinely new one.
- **Freezes on a correct answer**, holding the fill and the biker in place through the celebration
  instead of draining on underneath it — the biker **stops** short of the cake, which is exactly
  what winning it looks like.
- **Whether the bar still had water is read at the instant ✓ is pressed** — not after the 200 ms
  see-your-answer pause (§6), so that pause can never cost the bonus.

### 18.5 The speed bonus: a second star

Beat the bar on a correct answer and the star slot earns a **second, bonus star** — the 🎂 cake the
biker was racing towards — alongside the regular ⭐.

- **Sequence:** the regular star flies and smashes home exactly as in §7; **250 ms later** the
  **cake lifts off the start of the water bar** at its small on-bar size, swells to full size as it
  rises, and snaps down onto the same slot with its own impact ring (it doesn't just pop into
  existence at screen centre the way the plain star does). The **cake leaves the bar** — it was
  won — while the **biker stays frozen** where he stopped. The next problem puts a fresh cake back.
- **Streak rewards wait for it.** A 3/6/9-streak reward (§7) fires only once the cake has landed,
  so a candy rain or fly-by never plays over the flight, and the next problem is held for the
  cake's flight *plus* the reward's full run.
- Under `prefers-reduced-motion` the bonus star simply **appears** on the slot, no flight.
- **Missing the bar is silent.** No sound, no message, no mark on the star — the regular star and
  its full celebration land identically either way. The *only* difference is the absence of an
  extra.
- Bonus stars earned across a game feed two things: the trophy row (§18.7) and the between-games
  drain adjustment (§18.4). They do **not** affect the §11 score, which stays `10 − mistakes`.

### 18.6 Stats are tracked separately

Easy and Fast keep **entirely independent histories** — games, scores, accuracy, streaks,
sessions, days played, favourite theme, trickiest problems, and the 30-day response-time log —
with the stats screen's own copy of the toggle (§18.1) choosing which one is displayed, and
"Reset stats" clearing only the displayed one. The mastery badge (§13) is likewise per-mode.

**Why separate:** the two modes measure different things, so pooling them would corrupt both — a
Fast-mode miss made under time pressure isn't the same event as an Easy-mode one, and averaging
them would quietly drag the accuracy signal that §18.4 and §13 both read.

**Migration:** stats saved before Fast mode existed were one flat blob with no mode on them. They
are adopted wholesale as **Easy** history (which is what they are), and Fast starts empty. No
history is rewritten or re-guessed.

**Known gap:** bonus-star counts aren't recorded in stats — they're consumed for the drain
adjustment and the trophies, then discarded. "How often do I beat the bar, over time?" is
therefore not answerable from the stats screen today; it's the obvious next stat if Fast mode
proves out.

### 18.7 Winning in Fast mode

- **Its own trophy pool:** 60 glyphs deliberately disjoint from Easy's (§9) — gems, dragons,
  medals, tools — so a glance at the prize box separates the two even before the badge is noticed.
- **The trophy row** is the usual one-per-longest-streak-point (§9), plus **one 🎂 appended per
  speed bonus** earned that game — the cakes won off the water bar (§18.5) — so the row shows both
  what was answered right and what was answered fast.
- **The prize box** (§12) is shared by both modes, one chronological shelf; a Fast-mode tile wears
  a small **🚴 badge** in its corner. Tile size still follows that game's score, identically. Fast
  prizes play **both** shelf games — the tap combo *and* the four-of-a-kind merge — and a Fast
  merge pays out another Fast prize, badge and all, so spending duplicates never quietly demotes
  a Fast win into an easy one.
- **The snake easter egg** (§14) still needs a perfect game, but in Fast mode it's **1-in-2**
  instead of 1-in-3, **red**, **twice as long**, and crawls **twice as long** before shedding.

### 18.8 What Fast mode is *not*

- **Not harder arithmetic.** The number range is, if anything, narrower than Easy mode's top
  (§18.2). The only thing added is a clock.
- **Not a punishment mode.** See the constraint at the top of §18; every design decision here —
  the generous seed, the ratchet that also eases *down*, the bonus being purely additive, the
  bar being read at submit time, the opt-in gate, the non-persisted setting — exists to keep it
  that way.
- **Not §17.1.** The math is still a gate in front of a reward, now a timed one; the fun doesn't
  yet *run on* recall speed in the way that item describes.
- **Not per-fact adaptivity (§17.3).** One global drain speed for all problems — the bar doesn't
  know that `8 + 7` is harder for this child than `2 + 3`.
