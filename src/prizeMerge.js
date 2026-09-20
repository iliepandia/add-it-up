// The four-of-a-kind merge game, played on the prize-box shelf with easy-mode
// prizes only (a Fast-mode prize can't join a group — see prizeBox.js).
//
//   tap a prize            - it gets a "1" badge; a group is now building
//   tap another of the SAME emoji - "2", then "3"
//   tap a fourth           - the other three fly into the fourth tile, which
//                            becomes a 🎁 present sitting in that exact slot,
//                            lit by a glow underneath so it can't be missed
//   tap the present        - it bursts open into a brand-new easy prize, and
//                            that prize can immediately start a group of its own
//
// A group drops (badges and all) on: a tap on a different easy emoji, a tap on
// any Fast-mode prize, GROUP_WINDOW of silence, or leaving the box.
//
// Nothing is written to storage until a present is actually *opened* — that is
// the moment the trade becomes permanent (four entries out, one new one in, at
// the last-tapped tile's position). Until then the group is pure screen state,
// so a child who wanders off keeps all four prizes.

import { WIN_END, pick, reduceMotion } from "./config.js";
import { prizeFx } from "./dom.js";
import { spawnParticle } from "./fx.js";
import { mergeLock, presentPop } from "./audio.js";
import { playAnim } from "./prizeCombo.js";
import { mergePrizes } from "./prizes.js";

const GROUP_SIZE = 4;
const GROUP_WINDOW = 10000;  // ms of quiet that drops a part-built group — long,
                             // because finding the next copy means scrolling a shelf
const PRESENT_GLYPH = "🎁";
const FLY_MS = 480;          // the three losing tiles' flight into the fourth
const BURST_REVEAL = 380;    // into present-burst, where 🎁 turns into the new prize
const BURST_MS = 900;        // the whole burst, after which the shelf is rebuilt

// The group being built, if any: the emoji everyone must match, and one entry
// per tile already in it. `tile` is the render record from getPrizeTiles(),
// carrying the storage index the trade will need.
let group = null;    // { emoji, members: [{ cell, face, tile }], timer }
// A merged present waiting to be opened. While one exists no new group builds:
// the group's storage indices are still unwritten, and a second pending trade
// would be computed against indices the first one is about to invalidate.
let present = null;  // { cell, face, emoji, indices, keepIndex, scale, perfect }

// Supplied by prizeBox.js, which owns the shelf and the per-prize sound map.
let rerenderShelf = () => {};
let playPrizeSound = () => {};

export function initPrizeMerge({ rerender, prizeSound }){
  rerenderShelf = rerender;
  playPrizeSound = prizeSound;
}

/** Drop everything — called when the box opens and when it closes, so a group
 *  or an unopened present never survives a visit. The DOM is rebuilt from
 *  scratch on open, so only the bookkeeping needs clearing here. */
export function resetPrizeMerge(){
  if(group) clearTimeout(group.timer);
  group = null;
  present = null;
}

/** Abandon a part-built group, taking its badges off the shelf. */
export function breakGroup(){
  if(!group) return;
  clearTimeout(group.timer);
  group.members.forEach(m => unbadge(m.cell));
  group = null;
}

/** If `cell` is the pending present, open it and report that the tap is spent.
 *  prizeBox.js gives this first refusal on every tap. */
export function presentTap(cell){
  if(!present || present.cell !== cell) return false;
  openPresent();
  return true;
}

/** One tap on an easy-mode prize. `tapOne` is the shelf's random wiggle and
 *  `tapSound` that prize's own voice — both reused verbatim, so a tap that
 *  isn't completing a group looks and sounds exactly as it always has. */
export function easyPrizeTap(tile, cell, face, tapOne, tapSound){
  // A pending present has the floor: tiles still react, but no group builds
  // until it is opened.
  if(present){ tapOne(); tapSound(); return; }

  if(group && group.emoji !== tile.emoji) breakGroup();
  if(!group) group = { emoji: tile.emoji, members: [], timer: 0 };
  clearTimeout(group.timer);

  // Four *distinct* tiles, not four taps: re-tapping one already in the group
  // still plays, but the count doesn't move. Owning four copies is the game.
  const already = group.members.some(m => m.tile.index === tile.index);
  if(already){
    tapOne(); tapSound();
    group.timer = setTimeout(breakGroup, GROUP_WINDOW);
    return;
  }

  group.members.push({ cell, face, tile });
  if(group.members.length >= GROUP_SIZE){
    tapSound();   // the prize's own voice, then straight into the merge — no
    merge();      // random wiggle, because the tile is about to fly anyway
    return;
  }

  tapOne(); tapSound();
  badge(cell, group.members.length);
  group.timer = setTimeout(breakGroup, GROUP_WINDOW);
}

// ---- badges ----

function badge(cell, n){
  let b = cell.querySelector(".prize-count");
  if(!b){ b = document.createElement("span"); b.className = "prize-count"; cell.appendChild(b); }
  b.textContent = String(n);
}

function unbadge(cell){
  const b = cell.querySelector(".prize-count");
  if(b) b.remove();
}

// ---- merging ----

function merge(){
  const members = group.members;
  const last = members[members.length - 1];
  // The reward inherits the biggest of the four, rainbow ring and all, so a
  // merge is never a downgrade and four big prizes are worth grouping.
  const best = members.reduce((a, m) => (m.tile.scale > a.tile.scale ? m : a), members[0]);

  clearTimeout(group.timer);
  members.forEach(m => unbadge(m.cell));
  const emoji = group.emoji;
  group = null;

  present = {
    cell: last.cell, face: last.face, emoji,
    indices: members.map(m => m.tile.index),
    keepIndex: last.tile.index,
    scale: best.tile.scale, perfect: best.tile.perfect
  };

  mergeLock();
  const target = last.cell.getBoundingClientRect();
  members.forEach(m => { if(m !== last) flyInto(m.cell, target); });

  setTimeout(() => {
    members.forEach(m => { if(m !== last) m.cell.remove(); });
    becomePresent(last.cell, last.face, best.tile.scale);
  }, FLY_MS);
}

/** Send a losing tile across the shelf into the winner. Transform and opacity
 *  only, so the three in flight never nudge the tiles they leave behind — the
 *  grid doesn't re-pack until they are actually removed. */
function flyInto(cell, target){
  const r = cell.getBoundingClientRect();
  const dx = (target.left + target.width / 2) - (r.left + r.width / 2);
  const dy = (target.top + target.height / 2) - (r.top + r.height / 2);
  cell.style.zIndex = "4";
  cell.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: `translate(${dx * 0.22}px,${dy * 0.22 - 18}px) scale(1.12)`, opacity: 1, offset: 0.3 },
    { transform: `translate(${dx}px,${dy}px) scale(.18)`, opacity: 0 }
  ], { duration: FLY_MS, easing: "cubic-bezier(.4,0,.5,1)", fill: "forwards" });
}

function becomePresent(cell, face, scale){
  cell.classList.remove("prize-perfect");   // the present wears its own look; the
  cell.classList.add("prize-present");      // ring comes back with the prize inside
  // Size the slot to the reward it holds, so the present already shows how
  // big the prize coming out of it will be.
  cell.style.setProperty("--scale", scale);
  face.textContent = PRESENT_GLYPH;
  playAnim(face, "present-appear", 0.7);
  // Removing three tiles re-packs the grid, so the present may have moved.
  cell.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function openPresent(){
  const p = present;
  present = null;

  // Never hand back the emoji just spent — a merge should always feel like
  // trading up into something else.
  const pool = WIN_END.filter(e => e !== p.emoji);
  const won = pick(pool.length ? pool : WIN_END);

  p.cell.classList.remove("prize-present");
  playAnim(p.face, "present-burst", BURST_MS / 1000);
  presentPop();

  if(!reduceMotion){
    const r = p.cell.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for(let i = 0; i < 22; i++) spawnParticle(pick(["✨", "🎉", "🎊"]), cx, cy, 28, 26, prizeFx);
  }

  // The trade becomes permanent here and nowhere else.
  const newIndex = mergePrizes(p.indices, p.keepIndex, won, p.scale, p.perfect);

  // Mid-burst, at the animation's widest point, the wrapping gives way to what
  // was inside it.
  setTimeout(() => {
    p.face.textContent = won;
    if(p.perfect) p.cell.classList.add("prize-perfect");
    playPrizeSound(won);
  }, BURST_REVEAL);

  // Then the shelf is rebuilt so every tile's storage index is honest again.
  // The new tile is already showing the right emoji at the right size, so this
  // swap is invisible — it just re-wires the taps.
  setTimeout(() => rerenderShelf(newIndex), BURST_MS);
}
