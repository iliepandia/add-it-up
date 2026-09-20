// The badges next to the prize-box button on the theme picker.
//
// ACCURACY (both modes): an emoji climbing a "rough stone -> crown jewel"
// ladder as 7-day accuracy goes from under 50% to a perfect 100%, ringed by a
// thin arc that fills across each 5-point tier. 11 tiers; the first 10 divide
// 50%-100% into even 5% bands (so "every 5%" moves one tier), and the 11th
// (crown) is reserved exclusively for an exact 100% — zero wrong submissions
// in the window, not just rounding up to it. The arc fills across one tier's
// 5-point span, so each 0.5% moves it a fixed 10%. Emoji size steps evenly
// from 1x to 2x.
//
// The ladder used to run snail -> chicken -> ... -> dinosaur, which is a
// *speed* metaphor driving an *accuracy* number: a child reading the snail as
// "you are slow" was reading it wrong. Treasure says "flawless", which is what
// accuracy actually measures, and leaves the speed imagery free for the badge
// below.
//
// SPEED (Fast mode only): a second badge beside it, climbing a vehicle ladder
// from walking to a rocket as the child answers faster *than they themselves
// used to* (stats.js getSpeedProgress). Two rules it must never break (§17.6):
//   - The bottom rung is WALKING, not a snail. A child who hasn't sped up yet
//     is shown something ordinary and neutral, never an insult. There is no
//     "you are slow" state on this ladder at all.
//   - It ratchets. A tier once reached is kept, so a tired week never takes a
//     badge away. The measurement is against their own starting pace, never a
//     fixed number of seconds.
// The bike sits at rung 4, which also gives Fast mode's cyclist somewhere to
// belong instead of appearing unexplained.

import {
  masteryBadge, masteryEmoji, masteryArc, masteryBalloon, masteryBalloonEmoji, masteryBalloonCaption,
  speedBadge, speedEmoji, speedArc, speedBalloon, speedBalloonEmoji, speedBalloonCaption
} from "./dom.js";
import { sDing } from "./audio.js";
import { getPrecision7d, getSpeedProgress, SPEED_TOP_GAIN } from "./stats.js";
import { testJumpToWin } from "./win.js";
import { state } from "./state.js";

const TIERS = ["🪨","🧱","🪙","🔮","💍","🎖️","🥉","🥈","🥇","💎","👑"];
const SPEED_TIERS = ["🚶","🏃","🛴","🚲","🛵","🏍️","🚗","🚄","✈️","🛸","🚀"];
const TROPHY = TIERS.length - 1; // 10 — the crown, perfect-accuracy only
const TOP_SPEED = SPEED_TIERS.length - 1;
const R = 44, CIRC = 2 * Math.PI * R;
const BALLOON_MS = 3000;
const BALLOON_POP_OUT_MS = 200;

let testMode = false;
let testPrecision = 0;
let testSpeedGain = 1;
let keyBuf = "";
// One of these per badge — the balloons open and close independently.
function balloonState(){ return { open: false, timer: null, cleanup: null }; }
const accBalloon = balloonState();
const spdBalloon = balloonState();

function tierIndexFor(precision, isPerfect){
  if(isPerfect) return TROPHY;
  if(precision < 50) return 0;
  return Math.min(TROPHY - 1, Math.floor((precision - 50) / 5));
}

function arcFractionFor(precision, tier, isPerfect){
  if(isPerfect) return 1;
  if(precision < 50) return 0;
  const within = (precision - 50) - tier * 5;
  return Math.max(0, Math.min(1, within / 5));
}

function currentTier(){
  const real = getPrecision7d(state.mode);
  const precision = testMode ? testPrecision : (real.hasData ? real.precision : 0);
  const isPerfect = testMode ? testPrecision >= 100 : (real.hasData && real.wrongTotal === 0 && real.correctTotal > 0);
  return { precision, isPerfect, tier: tierIndexFor(precision, isPerfect) };
}

/** Paints one badge. Both badges are the same widget with a different ladder
 *  behind them, so the drawing lives here once. */
function paintBadge(badgeEl, emojiEl, arcEl, glyph, tier, topTier, frac, crowned){
  emojiEl.textContent = glyph;
  badgeEl.style.setProperty("--scale", 1 + tier / topTier);
  badgeEl.classList.toggle("mastery-perfect", crowned);
  arcEl.setAttribute("stroke-dasharray", String(CIRC));
  arcEl.setAttribute("stroke-dashoffset", String(CIRC * (1 - frac)));
}

// Where the child sits on the speed ladder, and how far through that rung.
// gain 1 (no faster than they started) is rung 0 — walking — and the top rung
// is SPEED_TOP_GAIN. Never negative: getSpeedProgress floors gain at 1.
function speedTierFor(gain){
  const span = (SPEED_TOP_GAIN - 1) / TOP_SPEED;         // gain per rung
  const steps = (Math.max(1, gain) - 1) / span;
  // Nudge before flooring: a gain sitting exactly on a rung divides to
  // something like 8.999999999999998 in binary floating point, which would
  // park a child one rung below the milestone they just earned.
  const tier = Math.min(TOP_SPEED, Math.floor(steps + 1e-9));
  return { tier, frac: tier >= TOP_SPEED ? 1 : Math.max(0, Math.min(1, steps - tier)) };
}

function currentSpeed(){
  const p = getSpeedProgress(state.mode);
  const gain = testMode ? testSpeedGain : p.gain;
  return { ...p, gain, ...speedTierFor(gain) };
}

export function renderMasteryBadge(){
  const { precision, isPerfect, tier } = currentTier();
  paintBadge(masteryBadge, masteryEmoji, masteryArc, TIERS[tier], tier, TROPHY,
             arcFractionFor(precision, tier, isPerfect), tier === TROPHY);

  // The speed badge is Fast mode's alone — Easy mode shows nothing
  // speed-related anywhere (§18.8), and that includes here.
  const showSpeed = state.mode === "hard";
  speedBadge.hidden = !showSpeed;
  if(!showSpeed){ hideSpeedBalloon(); return; }
  const s = currentSpeed();
  paintBadge(speedBadge, speedEmoji, speedArc, SPEED_TIERS[s.tier], s.tier, TOP_SPEED,
             s.frac, s.tier === TOP_SPEED);
}

// Tapping the badge pops up a balloon previewing the next badge to unlock
// (or a "champion" note once the trophy is reached). Another tap, or 3s of
// no input, pops it back down.
function nextBadgeInfo(tier){
  if(tier === TROPHY) return { emoji: TIERS[TROPHY], caption: "You're a champion!" };
  const nextTier = tier + 1;
  const caption = nextTier === TROPHY ? "Reach 100%, no mistakes!" : `Reach ${50 + nextTier * 5}%!`;
  return { emoji: TIERS[nextTier], caption };
}

function showBalloonOn(st, el, emojiEl, captionEl, info){
  emojiEl.textContent = info.emoji;
  captionEl.textContent = info.caption;
  clearTimeout(st.timer);
  clearTimeout(st.cleanup); st.cleanup = null;
  el.hidden = false;
  el.classList.remove("balloon-pop-out");
  void el.offsetWidth; // restart the pop-in animation even if it was already open
  el.classList.add("balloon-open", "balloon-pop-in");
  st.open = true;
  st.timer = setTimeout(() => hideBalloonOn(st, el), BALLOON_MS);
}

function hideBalloonOn(st, el){
  if(!st.open) return;
  st.open = false;
  clearTimeout(st.timer);
  clearTimeout(st.cleanup);
  el.classList.remove("balloon-pop-in", "balloon-open");
  el.classList.add("balloon-pop-out");
  st.cleanup = setTimeout(() => {
    el.hidden = true;
    el.classList.remove("balloon-pop-out");
    st.cleanup = null;
  }, BALLOON_POP_OUT_MS);
}

function showBalloon(){
  showBalloonOn(accBalloon, masteryBalloon, masteryBalloonEmoji, masteryBalloonCaption,
                nextBadgeInfo(currentTier().tier));
}
function hideBalloon(){ hideBalloonOn(accBalloon, masteryBalloon); }
function hideSpeedBalloon(){ hideBalloonOn(spdBalloon, speedBalloon); }

// The speed balloon never states a target time — §17.6 rules out showing a
// child a number of seconds to beat. It names the next vehicle and frames it
// as "a bit quicker than you", which is what the ladder actually measures.
function nextSpeedInfo(s){
  if(!s.hasData) return { emoji: SPEED_TIERS[1], caption: `Play ${s.needed} games to start!` };
  if(s.tier >= TOP_SPEED) return { emoji: SPEED_TIERS[TOP_SPEED], caption: "Top speed!" };
  return { emoji: SPEED_TIERS[s.tier + 1], caption: "Answer a bit quicker!" };
}

function showSpeedBalloon(){
  showBalloonOn(spdBalloon, speedBalloon, speedBalloonEmoji, speedBalloonCaption,
                nextSpeedInfo(currentSpeed()));
}

export function wireMasteryBadge(){
  masteryBadge.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation();
    sDing();
    hideSpeedBalloon();
    if(accBalloon.open) hideBalloon(); else showBalloon();
  });
  speedBadge.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation();
    sDing();
    hideBalloon();
    if(spdBalloon.open) hideSpeedBalloon(); else showSpeedBalloon();
  });
}

function toggleTestMode(){
  testMode = !testMode;
  if(testMode){
    const real = getPrecision7d(state.mode);
    testPrecision = real.hasData ? Math.round(real.precision * 2) / 2 : 0; // start from the real value, snapped to a 0.5 step
    testSpeedGain = getSpeedProgress(state.mode).gain;
  }
  sDing();
  renderMasteryBadge();
}

/** Call from the picker's keydown handling; returns true if the key was
 *  consumed (typing T-E-S-T toggles test mode; while it's on, Up/Down move
 *  the badge's precision by ±0.5% for visual testing, and S — pressed fresh,
 *  not mid-way through retyping T-E-S-T to toggle off — jumps straight to a
 *  fully-loaded win screen to test the snake's eat animation). */
export function handlePickerKeydown(e){
  const k = e.key;
  if(k === "ArrowUp" || k === "ArrowDown"){
    if(!testMode) return false;
    testPrecision = Math.max(0, Math.min(100, testPrecision + (k === "ArrowUp" ? 0.5 : -0.5)));
    renderMasteryBadge();
    return true;
  }
  // Left/Right walk the speed ladder in test mode, the way Up/Down walk the
  // accuracy one — one tenth of a rung per press.
  if(k === "ArrowRight" || k === "ArrowLeft"){
    if(!testMode) return false;
    const step = (SPEED_TOP_GAIN - 1) / TOP_SPEED / 10;
    testSpeedGain = Math.max(1, Math.min(SPEED_TOP_GAIN, testSpeedGain + (k === "ArrowRight" ? step : -step)));
    renderMasteryBadge();
    return true;
  }
  if(testMode && keyBuf === "" && (k === "s" || k === "S")){
    testJumpToWin();
    return true;
  }
  if(k.length === 1 && /[a-zA-Z]/.test(k)){
    keyBuf = (keyBuf + k.toLowerCase()).slice(-4);
    if(keyBuf === "test"){ keyBuf = ""; toggleTestMode(); return true; }
  }
  return false;
}
