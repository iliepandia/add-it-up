// Hard-mode prize taps escalate; easy-mode ones don't (see prizeBox.js).
//
// Tapping the same hard prize again inside COMBO_WINDOW builds a combo:
//   tap 1 - the same random reaction an easy prize gives (a wiggle + its sound)
//   tap 2 - CHARGED: one fixed "winding up" motion, a rising tone, and the
//           tile holds a warm glow until the window lapses
//   tap 3 - ERUPTION: a full-screen finale chosen to match that specific
//           prize (a volcano rains fire, a dragon sweeps across, a tornado
//           spirals out), then the combo resets to zero.
// Taps 2 and 3 are deliberately *not* random: the escalation has to be
// learnable, so a child can discover that a third tap sets the thing off.

import { rnd, reduceMotion } from "./config.js";
import { prizeFx, prizeStrip } from "./dom.js";
import { spawnParticle } from "./fx.js";
import { comboCharge, comboBoom } from "./audio.js";

const COMBO_WINDOW = 1200;  // ms of quiet that drops a part-built combo
const TIER_CHARGE = 2, TIER_ERUPT = 3;

// Per-tile combo state. Keyed weakly on the cell element, which the prize box
// throws away and rebuilds on every open — so state never outlives its tile.
const combos = new WeakMap();

/** Restart `name` on `el` cleanly even if it is already mid-animation, and
 *  hand the element back to CSS once it finishes. */
export function playAnim(el, name, dur){
  el.style.animation = "none"; void el.offsetWidth;
  el.style.animation = `${name} ${dur}s ease`;
  el.addEventListener("animationend", () => { el.style.animation = ""; }, { once: true });
}

/** One hard-prize tap. `tapOne` is the easy-mode reaction, reused verbatim for
 *  the first tap so the two modes only diverge once a combo is actually under
 *  way. `playSound` fires at every tier — the prize keeps its own voice. */
export function hardPrizeTap(cell, face, emoji, tapOne, playSound){
  const st = combos.get(cell) || { count: 0, timer: 0 };
  combos.set(cell, st);
  clearTimeout(st.timer);
  st.count += 1;

  if(st.count >= TIER_ERUPT){
    st.count = 0;
    cell.classList.remove("combo-charged");
    playAnim(face, "combo-erupt", 1);
    playSound();
    comboBoom();
    erupt(cell, emoji);
    return;
  }

  if(st.count === TIER_CHARGE){
    cell.classList.add("combo-charged");
    playAnim(face, "combo-charge", 0.55);
    playSound();
    comboCharge();
  }else{
    tapOne();
    playSound();
  }

  // A combo left hanging simply cools off, so a tile is never stuck charged.
  st.timer = setTimeout(() => { st.count = 0; cell.classList.remove("combo-charged"); }, COMBO_WINDOW);
}

/** Drop any particles still in flight — called when the box opens or closes so
 *  a finale never bleeds into the next visit. */
export function resetPrizeFx(){
  prizeFx.innerHTML = "";
  prizeStrip.classList.remove("shelf-quake");
}

// ---- eruptions ----
// Six kinds, each glyph mapped to the one that matches what it *is* — the same
// family approach the tap sounds use, rather than 60 bespoke finales. `g` is
// the particle glyph (often not the prize itself: a volcano throws fire, a
// wave throws water); it defaults to the prize's own glyph. `tint` colours the
// screen wash that `flash` does.
const ERUPTIONS = {
  "💎": { kind: "burst", g: "✨" },         "🔥": { kind: "rain", g: "🔥" },
  "⚡": { kind: "flash", tint: "#FFF3A8" },  "🎖️": { kind: "burst", g: "✨" },
  "🥇": { kind: "burst", g: "✨" },         "🛡️": { kind: "quake" },
  "⚔️": { kind: "quake" },                  "🧨": { kind: "burst", g: "💥" },
  "🎯": { kind: "burst" },                  "🔮": { kind: "swirl", g: "✨" },

  "🧩": { kind: "burst" },                  "🕹️": { kind: "flash", tint: "#8CFF9E" },
  "🏹": { kind: "sweep" },                  "🪄": { kind: "swirl", g: "✨" },
  "🧿": { kind: "flash", tint: "#9FD8FF" }, "🗝️": { kind: "rain" },
  "👑": { kind: "rain" },                   "🎇": { kind: "burst", g: "✨" },
  "🌋": { kind: "rain", g: "🔥" },          "🦂": { kind: "quake" },

  "🦈": { kind: "sweep" },                  "🐉": { kind: "sweep" },
  "🦇": { kind: "sweep" },                  "🦅": { kind: "sweep" },
  "🐺": { kind: "quake" },                  "🦏": { kind: "quake" },
  "🦍": { kind: "quake" },                  "🐆": { kind: "sweep" },
  "🦖": { kind: "quake" },                  "🦕": { kind: "quake" },

  "🌠": { kind: "sweep" },                  "☄️": { kind: "sweep" },
  "🛰️": { kind: "sweep" },                  "🧲": { kind: "swirl" },
  "⛏️": { kind: "quake" },                  "🔱": { kind: "flash", tint: "#A8F0FF" },
  "🪓": { kind: "quake" },                  "🏆": { kind: "rain", g: "✨" },
  "🥋": { kind: "quake" },                  "🎲": { kind: "burst" },

  "🃏": { kind: "swirl" },                  "🎰": { kind: "rain", g: "💎" },
  "🧭": { kind: "swirl" },                  "⏱️": { kind: "swirl" },
  "🔋": { kind: "flash", tint: "#B6FFA8" }, "🧪": { kind: "burst", g: "✨" },
  "🛎️": { kind: "burst", g: "✨" },         "📯": { kind: "flash", tint: "#FFE1A8" },
  "🚨": { kind: "flash", tint: "#FFA8A8" }, "🏴‍☠️": { kind: "sweep" },

  "💥": { kind: "burst" },                  "🌪️": { kind: "swirl" },
  "🌊": { kind: "rain", g: "💧" },          "🧱": { kind: "rain" },
  "🔗": { kind: "quake" },                  "🪃": { kind: "sweep" },
  "🥊": { kind: "quake" },                  "🎳": { kind: "quake" },
  "🛷": { kind: "sweep" },                  "🏔️": { kind: "quake" }
};

function erupt(cell, emoji){
  const spec = ERUPTIONS[emoji] || { kind: "burst" };
  const glyph = spec.g || emoji;
  const r = cell.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  shockRing(cx, cy);
  // Reduced motion still gets the sound, the face punch and the ring — just
  // not a screenful of flying emoji.
  if(reduceMotion) return;
  if(spec.kind === "rain") rain(glyph);
  else if(spec.kind === "sweep") sweep(glyph);
  else if(spec.kind === "swirl") swirl(glyph);
  else if(spec.kind === "flash") flash(spec.tint, emoji);
  else if(spec.kind === "quake") quake(glyph, cx, cy);
  else burst(glyph, cx, cy);
}

function shockRing(x, y){
  const ring = document.createElement("div"); ring.className = "prize-shock";
  const sz = Math.min(innerWidth, innerHeight) * 0.12;
  ring.style.cssText = `left:${x}px; top:${y}px; width:${sz}px; height:${sz}px;`;
  prizeFx.appendChild(ring);
  ring.animate([{ transform: "translate(-50%,-50%) scale(.3)", opacity: .9 },
                { transform: "translate(-50%,-50%) scale(3.2)", opacity: 0 }],
               { duration: 620, easing: "ease-out", fill: "forwards" });
  setTimeout(() => ring.remove(), 660);
}

// Radial blast out of the tile itself — the generic finale, and the fallback
// for any prize with no entry above.
function burst(glyph, cx, cy){
  for(let i = 0; i < 24; i++) spawnParticle(glyph, cx, cy, 34, 30, prizeFx);
}

// Falls from above the screen. Shorter-lived and denser than the streak
// showers in rewards.js — this answers a tap, so it has to land immediately.
function rain(glyph){
  for(let i = 0; i < 30; i++) setTimeout(() => {
    const p = document.createElement("div"); p.className = "particle"; p.textContent = glyph;
    p.style.fontSize = (34 + rnd(40)) + "px"; prizeFx.appendChild(p);
    let y = -80, vy = 5 + Math.random() * 4, rot = rnd(360);
    const x = rnd(innerWidth), vr = (Math.random() - .5) * 14, t0 = performance.now();
    (function step(now){
      const dt = Math.min(32, now - (step.last || now)); step.last = now; const k = dt / 16;
      vy += 0.3 * k; y += vy * k; rot += vr * k;
      p.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg)`;
      if(y < innerHeight + 90 && now - t0 < 2600) requestAnimationFrame(step); else p.remove();
    })(t0);
  }, rnd(500));
}

// One giant glyph crosses the whole screen, for the prizes that move under
// their own power (dragon, shark, comet, boomerang).
function sweep(glyph){
  const s = document.createElement("div"); s.className = "prize-sweep"; s.textContent = glyph;
  const size = Math.min(innerWidth, innerHeight) * 0.42;
  const y = innerHeight * (0.25 + Math.random() * 0.35) - size / 2;
  s.style.fontSize = size + "px"; prizeFx.appendChild(s);
  s.animate([{ transform: `translate(${innerWidth + size}px,${y}px) rotate(6deg)` },
             { transform: `translate(${-size * 1.6}px,${y - size * 0.25}px) rotate(-6deg)` }],
            { duration: 1250, easing: "cubic-bezier(.35,0,.5,1)", fill: "forwards" });
  setTimeout(() => s.remove(), 1300);
}

// Spirals outward from screen centre — anything that turns or spins.
function swirl(glyph){
  const cx = innerWidth / 2, cy = innerHeight / 2;
  const reach = Math.max(innerWidth, innerHeight) * 0.62;
  for(let i = 0; i < 22; i++){
    const p = document.createElement("div"); p.className = "particle"; p.textContent = glyph;
    p.style.fontSize = (30 + rnd(30)) + "px"; prizeFx.appendChild(p);
    const a0 = (i / 22) * Math.PI * 2, t0 = performance.now(), life = 1500;
    (function step(now){
      const t = (now - t0) / life;
      const a = a0 + t * 4.2, rad = t * reach;
      p.style.transform = `translate(${cx + Math.cos(a) * rad}px,${cy + Math.sin(a) * rad}px) rotate(${t * 720}deg)`;
      p.style.opacity = String(Math.max(0, 1 - t * t));
      if(t < 1) requestAnimationFrame(step); else p.remove();
    })(t0);
  }
}

// A wash of colour over the whole box plus a few outsized glyphs — for the
// prizes that are themselves a burst of light or noise.
function flash(tint, glyph){
  const sheet = document.createElement("div"); sheet.className = "prize-flash";
  sheet.style.background = tint || "#FFF3A8"; prizeFx.appendChild(sheet);
  sheet.animate([{ opacity: 0 }, { opacity: .72, offset: .12 }, { opacity: 0 }],
                { duration: 700, easing: "ease-out", fill: "forwards" });
  setTimeout(() => sheet.remove(), 740);
  for(let i = 0; i < 8; i++) spawnParticle(glyph, innerWidth / 2, innerHeight * 0.45, 58, 40, prizeFx);
}

// The shelf itself takes the hit: everything shudders as one (so no tile moves
// relative to its neighbours) while heavy glyphs thud out of the tile.
function quake(glyph, cx, cy){
  prizeStrip.classList.remove("shelf-quake"); void prizeStrip.offsetWidth;
  prizeStrip.classList.add("shelf-quake");
  // animationend bubbles, so a tile animating *inside* the shelf would
  // otherwise end the quake early — only the shelf's own event counts.
  prizeStrip.addEventListener("animationend", function done(e){
    if(e.target !== prizeStrip) return;
    prizeStrip.classList.remove("shelf-quake");
    prizeStrip.removeEventListener("animationend", done);
  });
  for(let i = 0; i < 14; i++) spawnParticle(glyph, cx, cy, 42, 34, prizeFx);
}
