# Addition Game — Specification

**Purpose:** A web game that helps a 7-year-old practice single-digit addition.
**Status:** Clarified and locked, ready to build.
**Last updated:** 2026-09-11

> **Scope:** Sections 1–10 are **Phase 1 — build now**. Section 11 is **Phase 2 — deferred, do not build now** (learning-design upgrades captured for a later version).

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
   - Emoji drawn from a set of: animals, fruit, nature, birds, household items.
3. **Pips** — dice faces or domino tiles, e.g. `.` + `..` =
   - **Cap: 6 pips per operand.** If either operand is > 6, re-roll the pair for this
     problem (pip presentation only).

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
  - **6 in a row:** a **giant spaceship** flies slowly across the screen (~3.8 s).
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
  scaffolding in §11.)*

---

## 8. Sound

Synthesized in-browser (Web Audio), unlocked on the first user tap (mobile autoplay policy):

| Event | Sound |
|-------|-------|
| Key / tray press | click |
| Correct explosion | pop / party |
| Wrong answer | ding-ding |

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
- Show **"Good job!"**, then a **randomly chosen emoji** (from a set of **26** — happy, nature,
  and household objects) **repeated once per point of the longest streak** reached this game.
- The copies **reveal one at a time**, each with a **rising musical note**; when the reveal
  finishes (the sound is over), a **star explosion** bursts over the screen.
- Also show the hint **"Tap to play again"** and a **big orange "Play" button**.
- **Restart:** the Play button **or any tap/key** starts a new session (stars, difficulty, and
  longest-streak all reset).

---

## 10. Open items / future tweaks

- No backspace under auto-check (§5).
- A **linear difficulty ramp** is now in Phase 1 (§3, sum 5→12); the **adaptive, fact-tracking**
  version remains Phase 2 (§11.3).

---

## 11. Phase 2 — Learning design (deferred, do not build now)

Upgrades to make the math *emerge from play* rather than be a toll paid to reach a reward.
Ordered by leverage toward that goal; each is paired with the theory it draws on.

### 11.1 Make the numbers have a purpose (intrinsic integration) — *highest leverage*
The Phase 1 game is a **drill with juice**: solve the sum → get the fireworks. The math is
the toll, not the play. Convert it to an **endogenous** design where manipulating numbers
*is* the fun act — e.g. feed a creature exactly N berries, build a tower to a target height,
fill a jar to a line. The addition becomes something you *do to get what you want*.
*(Malone & Lepper; Habgood & Ainsworth, intrinsic integration.)*

### 11.2 Scaffold the second wrong attempt — *highest safety priority*
Phase 1 re-shows the identical problem until correct, with no teaching — a recipe for math
anxiety and learned helplessness when the child genuinely doesn't know the fact. Keep the
never-skip rule, but on the **second** miss, *help*: reveal pips under the digits, animate a
count-up, show a number line, or decompose (`8 + 7 → 8 + 2 = 10, then +5`). Reframe errors as
information, not verdicts. *(Dweck, growth mindset; Seligman, learned helplessness.)*

### 11.3 Adaptivity + fact-memory
Flat random difficulty prevents flow and a felt sense of progress. Track which addend pairs
the child misses, resurface them (spaced retrieval / testing effect), and let difficulty drift
upward as accuracy and speed rise. *(Csikszentmihalyi, flow; Roediger, testing effect.)*

### 11.4 Surface competence + one autonomy choice
Give a visible mastery signal beyond a single session (levels, cumulative progress) and at
least one real choice (pick the theme/world, or choose between two problems). *(Deci & Ryan,
Self-Determination Theory — competence + autonomy.)*

### 11.5 Sequence the representations (don't randomize blindly)
The three formats are concrete → abstract (pips/emoji → digits) and map onto how number sense
develops. Instead of random order, **lead concrete and fade toward abstract** as fluency on a
fact grows. *(Concrete–Representational–Abstract; Clements & Sarama, subitizing.)*

### Strengths to preserve from Phase 1
Multiple representations of quantity (symbolic / set-based / subitizable pips), immediate
feedback (200 ms), multimodal input, low cognitive load, and the never-skip principle
(once scaffolded per 11.2).
