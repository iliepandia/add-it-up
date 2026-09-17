// 7-day "mastery" badge shown next to the prize-box button on the theme
// picker: an emoji that grows from a snail up to a dinosaur — and finally a
// trophy for a flawless week — as 7-day accuracy climbs from under 50% to a
// perfect 100%, ringed by a thin arc that fills across each 5-point tier.
//
// 11 tiers span the emoji list; the first 10 divide 50%-100% into even 5%
// bands (so "every 5%" moves one tier), and the 11th (trophy) is reserved
// exclusively for an exact 100% — zero wrong submissions in the window, not
// just rounding up to it. The arc fills across one tier's 5-point span, so
// each 0.5% of precision moves it by a fixed 10% (10 half-percent steps =
// one full tier). Emoji size steps evenly from 1x (snail) to 2x (trophy).

import { masteryBadge, masteryEmoji, masteryArc, masteryBalloon, masteryBalloonEmoji, masteryBalloonCaption } from "./dom.js";
import { sDing } from "./audio.js";
import { getPrecision7d } from "./stats.js";

const TIERS = ["🐌","🐔","🐢","🐝","🐷","🐱","🐶","🐄","🐻","🦖","🏆"];
const TROPHY = TIERS.length - 1; // 10
const R = 44, CIRC = 2 * Math.PI * R;
const BALLOON_MS = 3000;
const BALLOON_POP_OUT_MS = 200;

let testMode = false;
let testPrecision = 0;
let keyBuf = "";
let balloonOpen = false;
let balloonTimer = null;   // 3s auto-dismiss timer
let balloonCleanup = null; // pending "finish hiding" timeout, cancelled if re-shown mid pop-out

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
  const real = getPrecision7d();
  const precision = testMode ? testPrecision : (real.hasData ? real.precision : 0);
  const isPerfect = testMode ? testPrecision >= 100 : (real.hasData && real.wrongTotal === 0 && real.correctTotal > 0);
  return { precision, isPerfect, tier: tierIndexFor(precision, isPerfect) };
}

export function renderMasteryBadge(){
  const { precision, isPerfect, tier } = currentTier();
  const frac = arcFractionFor(precision, tier, isPerfect);
  const scale = 1 + tier / TROPHY;

  masteryEmoji.textContent = TIERS[tier];
  masteryBadge.style.setProperty("--scale", scale);
  masteryBadge.classList.toggle("mastery-perfect", tier === TROPHY);
  masteryArc.setAttribute("stroke-dasharray", String(CIRC));
  masteryArc.setAttribute("stroke-dashoffset", String(CIRC * (1 - frac)));
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

function showBalloon(){
  const { tier } = currentTier();
  const info = nextBadgeInfo(tier);
  masteryBalloonEmoji.textContent = info.emoji;
  masteryBalloonCaption.textContent = info.caption;
  clearTimeout(balloonTimer);
  clearTimeout(balloonCleanup); balloonCleanup = null;
  masteryBalloon.hidden = false;
  masteryBalloon.classList.remove("balloon-pop-out");
  void masteryBalloon.offsetWidth; // restart the pop-in animation even if it was already open
  masteryBalloon.classList.add("balloon-open", "balloon-pop-in");
  balloonOpen = true;
  balloonTimer = setTimeout(hideBalloon, BALLOON_MS);
}

function hideBalloon(){
  if(!balloonOpen) return;
  balloonOpen = false;
  clearTimeout(balloonTimer);
  clearTimeout(balloonCleanup);
  masteryBalloon.classList.remove("balloon-pop-in", "balloon-open");
  masteryBalloon.classList.add("balloon-pop-out");
  balloonCleanup = setTimeout(() => {
    masteryBalloon.hidden = true;
    masteryBalloon.classList.remove("balloon-pop-out");
    balloonCleanup = null;
  }, BALLOON_POP_OUT_MS);
}

export function wireMasteryBadge(){
  masteryBadge.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation();
    sDing();
    if(balloonOpen) hideBalloon(); else showBalloon();
  });
}

function toggleTestMode(){
  testMode = !testMode;
  if(testMode){
    const real = getPrecision7d();
    testPrecision = real.hasData ? Math.round(real.precision * 2) / 2 : 0; // start from the real value, snapped to a 0.5 step
  }
  sDing();
  renderMasteryBadge();
}

/** Call from the picker's keydown handling; returns true if the key was
 *  consumed (typing T-E-S-T toggles test mode; while it's on, Up/Down move
 *  the badge's precision by ±0.5% for visual testing). */
export function handlePickerKeydown(e){
  const k = e.key;
  if(k === "ArrowUp" || k === "ArrowDown"){
    if(!testMode) return false;
    testPrecision = Math.max(0, Math.min(100, testPrecision + (k === "ArrowUp" ? 0.5 : -0.5)));
    renderMasteryBadge();
    return true;
  }
  if(k.length === 1 && /[a-zA-Z]/.test(k)){
    keyBuf = (keyBuf + k.toLowerCase()).slice(-4);
    if(keyBuf === "test"){ keyBuf = ""; toggleTestMode(); return true; }
  }
  return false;
}
