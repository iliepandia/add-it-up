# Add It Up — future improvements, recommendations & gaps

Companion to [`addition-game-spec.md`](addition-game-spec.md). **That file describes what the
game *is*; this one describes what it is *not yet*.** Nothing here is built.

Section numbers (§16, §17.x) match the spec's original numbering and are deliberately preserved
— the two files cross-reference each other roughly 39 times, so renumbering would break every
link. §16 and §17 keep anchor headings in the spec pointing here.

**Last evaluated:** 2026-09-19, against build 82 (the hard-mode prize combo merge).

---

## A. Evaluation: what's actually built against §17

Verified by reading the source, not by trusting the spec's own progress notes. The short
version: **the spec's self-assessment is accurate.** Every item it claims is shipped is
genuinely shipped, and every item it claims is unbuilt is genuinely absent from the code. That
is worth stating plainly, because it means the notes below can be trusted going forward.

| Item | Spec claims | Found in code | Verdict |
|---|---|---|---|
| **17.1** Intrinsic integration | Unaddressed | The math still gates an unrelated reward. Fast mode times the gate; it doesn't make the reward *run on* recall | ✅ claim accurate — **not built** |
| **17.2** Scaffold 2nd wrong | Unaddressed | `wrong()` in `main.js`: second miss calls `revealAnswer()` and nothing else — no pips, no count-up, no decomposition | ✅ claim accurate — **not built** |
| **17.3** Adaptivity + fact memory | Unaddressed | `getTopMistakes()` is imported by `statsScreen.js` only. `newProblem()` picks operands uniformly at random within the sum bound | ✅ claim accurate — **not built** |
| **17.4** Competence + autonomy | Both halves shipped | `mastery.js` (11 tiers) = competence; `presentationPicker.js` (per-problem choice) + mode choice = autonomy | ✅ claim accurate — **built** |
| **17.5** Sequence representations | Unaddressed | Easy mode: `pick(["digits","emoji","pips"])`, uniform. Pips correctly capped at ≤6; emoji groups are not (see G4) | ✅ claim accurate — **not built** |
| **17.6** steps 1–3 (baseline, personal target, additive reward) | Shipped | `recordLatency()` per first attempt; Fast mode's seeded-and-ratcheting drain; bonus star is purely additive | ✅ claim accurate — **built** |
| **17.6** steps 4–6 (speed-driven core, retire counting, latency→adaptivity) | Unbuilt | Confirmed absent | ✅ claim accurate — **not built** |

**The §17.6 safety constraint is honoured in the shipped code.** Nothing presents a child's own
response time as a shortfall: an emptied water bar costs nothing, the bonus star is strictly
additive, latency is recorded silently and is never surfaced to the child in either mode, and
Fast mode is opt-in behind a gate. This is the single most important property in the spec and
the implementation does not violate it anywhere I could find.

---

## B. Gaps

Ordered by priority. G1 is a safety issue; G2–G3 are measurement issues that block the items
above from ever being calibrated properly; G4–G8 are correctness, design and documentation debt.

### G1. Nothing helps a child who is genuinely stuck — *highest priority*
The second wrong answer reveals the correct one and moves on. There is no teaching step at all:
no pips under the digits, no count-up, no number line, no decomposition. This is §17.2, still
unbuilt, and it has become **more** urgent since Fast mode shipped — a child who doesn't know a
fact now meets that gap while a timer drains. §17.2 was already labelled "highest safety
priority" before the timed mode existed.

**Recommendation:** build §17.2 before any further §17.6 work. It is the only item in the
backlog whose absence can actively harm.

### G2. Speed is measured but never trended — you cannot see whether the child is getting faster
This corrects an earlier note that said speed of play isn't tracked at all. **It is tracked.**
`recordLatency()` (`main.js:65`) logs every problem's first-attempt time, tagged by presentation
and operand size, and the stats screen renders min / median / max per presentation and per
operand-size bucket over a rolling 30 days.

What's missing is **change over time.** `recordGame()` stores only `score` per game, so both
charts — last-30-games and the 30-day series — are correctness-only. The latency view is a
*snapshot* of the last 30 days, with no way to compare it to the 30 days before. For a game
whose stated goal (§1) is **fluency, not accuracy**, the one number that actually measures the
goal is the one number you cannot see a trend for. Accuracy, which is explicitly *not* the
goal, gets two charts.

**Recommendation:** store a per-game median latency alongside `score` in the game history, and
plot it as a second series on the 30-day chart. Cheap, it reuses the existing chart, and it
turns the existing data into the answer to "is this working?". This is also a prerequisite for
honestly calibrating §17.6 steps 2 and 4, which the spec says need real play data.

### G3. The latency log doesn't record whether the answer was right
`recordLatency()` fires in `submitEntry()` *before* the correctness check, and the stored entry
is `{presentation, maxOperand, ms, t}` — there is no correct/incorrect flag. So a fast wrong
guess and a fast correct recall are indistinguishable in the data, pooled into the same median.

This matches §17.6 step 1 *as written* ("problem shown → ✓/Enter"), so it is not a deviation
from spec — but it undermines what the measurement is for. "How fast does this child *recall*
this fact" cannot be answered by a pool that includes wrong attempts, and that pool is what
seeds Fast mode's drain duration (`getLatencyStats('easy').combined.max`).

The practical impact today is benign: a slow wrong attempt inflates the max, which makes the
first drain *more* generous, and generous is the safe direction. But the signal is muddied for
every future use, and §17.3/§17.6 step 6 both depend on distinguishing "correct but slow" from
"wrong" — which this data currently cannot do.

**Recommendation:** add a `correct` boolean to the latency entry. One field, backward-compatible
(older entries read as unknown), and it unblocks G2, §17.3 and §17.6 step 6.

### G4. Emoji groups run up to 9 items, which invites counting
`newProblem()` caps pips at 6 (`state.a>6||state.b>6`) — correct, 6 is the top of the subitizing
range and a die face is read at a glance. But `emojiGroup()` renders operands up to **9**, and
has explicit layout code for the large case (two rows, shrinking font). Nine scattered emoji
cannot be subitized; they get counted one at a time.

§17.6 step 5 is explicit that any presentation solvable by counting "works against automaticity"
and §17.5 says the sequencing axis is "away from operand sizes large enough to invite counting."
The pip cap already implements exactly this rule. The emoji path not having the same cap reads
as an oversight rather than a decision.

**Recommendation:** either cap emoji operands the same way pips are, or state in the spec why
emoji deliberately differ. Worth resolving one way or the other, since right now the codebase
applies the anti-counting rule to one presentation and not the other.

### G5. Mistake data is collected and displayed, but never acts on anything
`recordMistake()` tracks every miss and `getTopMistakes()` powers the "trickiest problems" list.
Nothing else reads it. `newProblem()` picks operands uniformly at random, so a fact the child
missed five times in a row is exactly as likely to reappear as one they have never missed.

This is §17.3's accuracy half, and it is the **cheapest real learning win left in the backlog**:
the data already exists, is already persisted and pruned, and only the selection call site needs
to change.

**Recommendation:** bias `newProblem()`'s operand pick toward recent misses (spaced retrieval).
Per §17.6's constraint and §17.3, a resurfaced fact must look identical to any other — no "let's
try this again" framing.

### G6. Fast mode's adaptivity is one global speed, not per fact
`hardDifficulty.js` keeps a single `durationMs` for every problem in every game, nudged ±15%
between games. A child fluent on `2+3` but slow on `8+7` gets the same bar for both. The spec
names this (§16) and §17.3 step 6 is where it eventually goes; noted here as a known limit
rather than a defect.

### G7. `adjustHardDrainDuration()` falls back to the hardest possible setting
In `hardDifficulty.js`:

```js
let durationMs = data ? data.durationMs : MIN_MS;   // MIN_MS = 2000ms = hardest
```

If the stored record is missing, the fallback is the **fastest** drain the game allows, not the
default seed. Unreachable in the normal flow — `getHardDrainDuration()` always writes a record at
game start — but if storage is cleared or fails mid-game, the next game silently jumps to maximum
difficulty. Every other fallback in the codebase degrades gently.

**Recommendation:** fall back to the same generous seed `getHardDrainDuration()` uses (easy-mode
max latency + 2 s, else 5 s + 2 s), not to `MIN_MS`. Small fix, and it matches the safety
posture everywhere else.

### ~~G8. The README's module map is 9 modules out of date~~ — **fixed 2026-09-19**
`README.md` had documented `src/` as 14 modules when there were **23**, missing essentially
everything added since Fast mode, the prize box and the mastery badge — and it didn't mention
either spec file, so the repo had no entry point to its own documentation.

**Resolved:** the module list now covers all 23 (grouped by role for readability, though the
files stay flat in `src/`), and a **Docs** section links `addition-game-spec.md` and
`addition-game-future.md`. Kept here as a record rather than deleted, since docs drift is the
kind of thing worth re-checking whenever a batch of modules lands.

---

## C. Priority summary

| # | Gap | Cost | Why now |
|---|---|---|---|
| G1 | No scaffold on 2nd wrong (§17.2) | High | Only item that can cause harm; worse now a timer exists |
| G2 | No speed trend | Low | Measures the actual goal; unblocks calibrating §17.6 |
| G3 | Latency log lacks correctness flag | Very low | One field; unblocks G2, §17.3, §17.6 step 6 |
| G5 | Misses never resurface (§17.3) | Low–medium | Data already exists; best learning-per-line-changed |
| G4 | Emoji groups invite counting | Low | Rule already exists for pips; just inconsistent |
| G7 | Hardest-setting fallback | Very low | Latent, one-line fix |
| G6 | Global not per-fact adaptivity (§16) | High | Genuinely Phase 2; depends on G3 |
| ~~G8~~ | ~~README module map stale~~ | — | **Fixed** 2026-09-19 |

A reasonable next slice: **G3 → G2 → G1**. G3 and G2 are small and make the game's own goal
measurable; G1 is the one that matters most and benefits from having that measurement in place
before it's tuned.

---

"""
## 16. Open items / future tweaks

- A **linear difficulty ramp** is now in Phase 1 (§3, sum 5→12); the **adaptive, fact-tracking**
  version remains Phase 2 (§17.3).
- Prize-box and mastery-badge tap sounds (§12, §13) are stylized synthesis (Web Audio, no audio
  files, §8) — meaningfully better than plain oscillator tones, but still a synth's approximation
  of a bark or a train, not a real recording. Revisit with real sample audio if truer realism is
  ever wanted; that would mean sourcing license-cleared clips and dropping the current
  single-HTML-file build (§2), so it's a deliberate trade-off, not an oversight.
- **Latency tracking: steps 1–3 of §17.6 have now shipped; steps 4–6 have not.** Step 1 (the
  passive per-answer baseline, §11) still runs exactly as specified, with zero visible effect on
  the game. Steps 2 and 3 — a personal, moving "fast" target and an additive reward for beating
  it — shipped as **Fast mode** (§18), deliberately behind an **explicit opt-in** rather than as a
  change to the default game: Easy mode is still the game described in §1–§16, with no timer and
  nothing speed-related visible anywhere. Still unbuilt: a speed-driven **core** mechanic (17.6
  step 4 / §17.1), retiring counting-solvable presentations (step 5 / §17.5), and folding latency
  into **fact-level** adaptivity (step 6 / §17.3) — Fast mode's adaptivity is one global drain
  speed, not per-fact. Scoring (§6, §11) remains purely correctness-based in **both** modes.
- **Fast mode's drain speed is calibrated from a small sample.** The first-ever drain duration is
  seeded from this child's **maximum** Easy-mode response time + 2 s, then nudged by ±15% per
  finished game (§18.4). The seed is deliberately generous, but one game's worth of evidence per
  adjustment is coarse; revisit the ±15% steps and the "drained on more than half the problems"
  threshold once there's real Fast-mode play data to read.

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
>
> **Update (2026-09-19):** **Fast mode shipped (§18)** — §17.6 steps 2 and 3, one day after step
> 1, and the first thing in this section to actually land. It sits behind an explicit opt-in and
> a gate (one finished Easy game, so the personal baseline is real data rather than a guess), and
> it also delivers **17.4's missing autonomy half twice over**: choosing the mode, and then
> choosing how to see *every single problem* (§18.3) — a real in-game choice, not just theme
> selection. What it is **not** is 17.1: the addition is still a gate in front of a reward, only
> now a timed one. 17.2 (second-wrong scaffolding), 17.3's fact-level adaptivity, and 17.5
> remain unaddressed — and 17.2 arguably matters *more* now that a timed mode exists.

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
2. **"Fast" is then defined relative to that baseline — never a fixed number.** *(Shipped
   2026-09-19 as Fast mode, §18.4 — as a personal seeded-and-ratcheting drain duration rather
   than a median-plus-margin; the "never a fixed number" rule is what it honours.)* Once real data
   exists, "improvement" means beating *this child's own* recent median by some small margin: a
   personal, moving target that ratchets up gently only as their actual times drop, and eases
   back down on an off day or a harder tier rather than staying pinned to a target they've fallen
   behind. No universal threshold (a guessed "1.5 seconds," say) should ever gate anything — see
   the constraint above.
3. **Reward fast-and-correct; never penalize slow-and-correct.** *(Shipped 2026-09-19 as Fast
   mode's bonus star, §18.5 — additive only: an emptied bar costs nothing.)* Once a personal
   baseline exists,
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
