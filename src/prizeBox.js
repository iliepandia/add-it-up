// The prize box screen: a wrapping, vertically-scrolling shelf of every prize
// won so far. Reachable only from the theme-picker screen (see main.js wiring).
// The list scrolls between two dark-wood end bars — they scroll with it, so
// reaching one is what tells you the list has ended — and leaves a tile-free
// gutter down its right edge to scroll by, since a tile eats its own
// pointerdown and a drag that starts on one can't move the shelf.

import { prizeBox, prizeBoxBack, prizeScroll, prizeStrip } from "./dom.js";
import {
  audio,
  tapMoo, tapBark, tapMeow, tapOink, tapQuack, tapNeigh, tapRoar, tapRibbit, tapHoot,
  tapHop, tapYip, tapBoop, tapPenguinHonk, tapSquawk, tapTurtleBlip, tapLadybugChirp,
  tapDolphinClick, tapWhaleCall, tapUnicornSparkle, tapFlutterBuzz, tapOctopusBlub,
  tapRocketWhoosh, tapBikeBell, tapCarHonk, tapTrainChug, tapHeliWhir, tapSailWhoosh, tapUfoWarble,
  tapBalloonSqueak, tapGiftRustle, tapTeddySqueak, tapConfettiPop, tapKiteFlutter, tapYoyoBoing, tapBallThump,
  tapPaintSwish, tapCastleFanfare, tapCircusDrumroll, tapCarouselTinkle, tapFerrisChime,
  tapCakeTada, tapIceCreamSwirl, tapMelonThud, tapBerryPop, tapLollipopTwinkle, tapDonutSquish,
  tapCupcakeSparkle, tapCookieCrunch,
  tapRainbowShimmer, tapSunGlow, tapBloomChime, tapMushroomBoop, tapTreeRustleTap
} from "./audio.js";
import {
  tapDragonRoar, tapDinoCall, tapSharkChomp, tapBatScreech, tapEagleScreech, tapWolfHowl,
  tapRhinoSnort, tapApeGrunt, tapBigCatSnarl, tapScorpionSkitter,
  tapFireCrackle, tapFirecracker, tapExplosion, tapSparkler, tapVolcanoRumble, tapZap,
  tapBatteryCharge, tapSiren, tapMagnetHum, tapPotionFizz,
  tapSwordClash, tapShieldClang, tapAxeChop, tapPickaxeStrike, tapBowTwang, tapTridentRing,
  tapPunchThud, tapChopWhoosh,
  tapGemChime, tapCrownFanfare, tapMedalChime, tapTrophyFanfare, tapKeyJingle, tapCrystalHum,
  tapMagicWand, tapWardChime,
  tapArcadeBlip, tapDiceRoll, tapCardFlick, tapSlotSpin, tapDartThunk, tapPuzzleClick, tapBowlingCrash,
  tapCompassPing, tapStopwatchTick, tapDeskBell, tapHornCall, tapFlagFlap, tapTornadoWhoosh,
  tapWaveCrash, tapBrickThud, tapChainClink, tapBoomerangWhirl, tapSledSwish, tapMountainWind,
  tapShootingStar, tapCometWhoosh, tapSatelliteBeep
} from "./audio.js";
import { pick, BONUS_GLYPH } from "./config.js";
import { getPrizeTiles } from "./prizes.js";
import { hardPrizeTap, playAnim, resetPrizeFx } from "./prizeCombo.js";
import { initPrizeMerge, presentTap, prizeTap, resetPrizeMerge } from "./prizeMerge.js";

// Every prize emoji (see WIN_END in config.js) maps to a sound that matches
// what it actually is, so a tap sounds like that prize instead of a random
// blip. Closely related prizes intentionally share a family (all roaring
// animals, all flowers, all "soft" critters, etc.) rather than each of the
// 60 needing a fully bespoke sound.
const PRIZE_SOUND = {
  "🐄": tapMoo, "🚀": tapRocketWhoosh, "🦖": tapRoar, "🚲": tapBikeBell, "🚗": tapCarHonk, "🎂": tapCakeTada,
  "🌈": tapRainbowShimmer, "🌞": tapSunGlow, "🌻": tapBloomChime, "🌸": tapBloomChime, "🌳": tapTreeRustleTap,
  "🍄": tapMushroomBoop, "🦋": tapFlutterBuzz, "🐢": tapTurtleBlip, "🐝": tapFlutterBuzz, "🐬": tapDolphinClick,
  "🎈": tapBalloonSqueak, "🎁": tapGiftRustle, "🧸": tapTeddySqueak, "🎉": tapConfettiPop, "🪁": tapKiteFlutter,
  "🚂": tapTrainChug, "⚽": tapBallThump, "🏰": tapCastleFanfare, "🎨": tapPaintSwish, "🍦": tapIceCreamSwirl,
  "🦄": tapUnicornSparkle, "🐙": tapOctopusBlub, "🐳": tapWhaleCall, "🦩": tapSquawk, "🦉": tapHoot,
  "🐧": tapPenguinHonk, "🦁": tapRoar, "🐯": tapRoar, "🐼": tapBoop, "🐨": tapBoop,
  "🦊": tapYip, "🐰": tapHop, "🐶": tapBark, "🐱": tapMeow, "🐸": tapRibbit,
  "🦆": tapQuack, "🐴": tapNeigh, "🐷": tapOink, "🐞": tapLadybugChirp, "🌺": tapBloomChime,
  "🌼": tapBloomChime, "🍉": tapMelonThud, "🍓": tapBerryPop, "🍭": tapLollipopTwinkle, "🍩": tapDonutSquish,
  "🍪": tapCookieCrunch, "🧁": tapCupcakeSparkle, "🎪": tapCircusDrumroll, "🎠": tapCarouselTinkle, "🎡": tapFerrisChime,
  "🚁": tapHeliWhir, "⛵": tapSailWhoosh, "🛸": tapUfoWarble, "🪀": tapYoyoBoing
};

// Hard mode's prize pool (HARD_WIN_END) is a different set of glyphs, so it
// gets its own mapping into the hard-mode sound bank — same idea, matched to
// what each prize is: 🐉 roars, ⚔️ clashes, 🎰 spins, 🌊 crashes. 🦖 is the one
// glyph both pools share, and it reuses the same roar in either.
const HARD_PRIZE_SOUND = {
  "💎": tapGemChime, "🔥": tapFireCrackle, "⚡": tapZap, "🎖️": tapMedalChime, "🥇": tapMedalChime,
  "🛡️": tapShieldClang, "⚔️": tapSwordClash, "🧨": tapFirecracker, "🎯": tapDartThunk, "🔮": tapCrystalHum,
  "🧩": tapPuzzleClick, "🕹️": tapArcadeBlip, "🏹": tapBowTwang, "🪄": tapMagicWand, "🧿": tapWardChime,
  "🗝️": tapKeyJingle, "👑": tapCrownFanfare, "🎇": tapSparkler, "🌋": tapVolcanoRumble, "🦂": tapScorpionSkitter,
  "🦈": tapSharkChomp, "🐉": tapDragonRoar, "🦇": tapBatScreech, "🦅": tapEagleScreech, "🐺": tapWolfHowl,
  "🦏": tapRhinoSnort, "🦍": tapApeGrunt, "🐆": tapBigCatSnarl, "🦖": tapRoar, "🦕": tapDinoCall,
  "🌠": tapShootingStar, "☄️": tapCometWhoosh, "🛰️": tapSatelliteBeep, "🧲": tapMagnetHum, "⛏️": tapPickaxeStrike,
  "🔱": tapTridentRing, "🪓": tapAxeChop, "🏆": tapTrophyFanfare, "🥋": tapChopWhoosh, "🎲": tapDiceRoll,
  "🃏": tapCardFlick, "🎰": tapSlotSpin, "🧭": tapCompassPing, "⏱️": tapStopwatchTick, "🔋": tapBatteryCharge,
  "🧪": tapPotionFizz, "🛎️": tapDeskBell, "📯": tapHornCall, "🚨": tapSiren, "🏴‍☠️": tapFlagFlap,
  "💥": tapExplosion, "🌪️": tapTornadoWhoosh, "🌊": tapWaveCrash, "🧱": tapBrickThud, "🔗": tapChainClink,
  "🪃": tapBoomerangWhirl, "🥊": tapPunchThud, "🎳": tapBowlingCrash, "🛷": tapSledSwish, "🏔️": tapMountainWind
};

function playPrizeSound(emoji){
  const fn = PRIZE_SOUND[emoji] || HARD_PRIZE_SOUND[emoji];
  if(fn) fn();
}

// A tap on a tile plays one of these at random, so the shelf feels alive
// without every prize doing the same thing.
const TAP_ANIMS = [
  { name: "tap-tada", dur: 0.9 },
  { name: "tap-shake", dur: 0.6 },
  { name: "tap-jump", dur: 0.7 },
  { name: "tap-rotate", dur: 0.6 },
  { name: "tap-wobble", dur: 0.9 },
  { name: "tap-bounce", dur: 0.9 },
  { name: "tap-pulse", dur: 0.5 },
  { name: "tap-flip", dur: 0.7 },
  { name: "tap-swing", dur: 0.8 },
  { name: "tap-heartbeat", dur: 0.9 }
];

function playTapAnim(el){
  const { name, dur } = pick(TAP_ANIMS);
  playAnim(el, name, dur);
}

function makeTile(tile, pop){
  const { emoji, scale, perfect, hard } = tile;
  // Two layers on purpose: the outer box is a stable grid cell that never
  // animates or moves, so its neighbors keep their position no matter what
  // happens to the emoji inside — only the inner face pops/scales/reacts.
  const cell = document.createElement("div");
  // prize-hard is what moves the merge game's count badge out from under the
  // 🚴 badge (both want the top-right corner) — see prizeBox.css.
  cell.className = "prize-tile" + (perfect ? " prize-perfect" : "") + (hard ? " prize-hard" : "");
  cell.style.setProperty("--scale", scale);

  const face = document.createElement("div");
  face.className = "prize-emoji";
  face.textContent = emoji;
  if(pop){
    face.style.animation = "trophyPop .4s cubic-bezier(.34,1.56,.64,1)";
    face.addEventListener("animationend", () => { face.style.animation = ""; }, { once: true });
  }
  cell.appendChild(face);

  if(hard){
    const badge = document.createElement("span");
    badge.className = "prize-hard-badge";
    badge.textContent = BONUS_GLYPH;
    cell.appendChild(badge);
  }

  // Every tap goes through the merge game (prizeMerge.js), which either spends
  // it on a matching set or hands it straight back to the tile's ordinary reaction:
  //  - a pending present gets first refusal and bursts open;
  //  - an easy prize's reaction is one random wiggle plus its voice;
  //  - a Fast prize's reaction is the combo escalation (prizeCombo.js), which
  //    counts taps on this one tile while the merge counts distinct tiles —
  //    two ladders climbing at once, neither in the other's way.
  const tapOne = () => playTapAnim(face);
  const voice = () => playPrizeSound(emoji);
  const react = hard
    ? () => hardPrizeTap(cell, face, emoji, tapOne, voice)   // plays its own voice at every tier
    : () => { tapOne(); voice(); };
  cell.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation(); audio();
    if(presentTap(cell)) return;
    prizeTap(tile, cell, face, react, voice);
  });
  return cell;
}

/** Build the shelf from storage. `focusIndex` is passed after a merge, when
 *  the reward's reveal has already played on screen: the rebuild then exists
 *  only to hand every tile its new, correct storage index, so nothing pops a
 *  second time and the scroll position is put back where the child left it. */
function renderPrizes(focusIndex){
  const merged = focusIndex != null;
  const keepScroll = prizeScroll.scrollTop;

  prizeStrip.innerHTML = "";
  const tiles = getPrizeTiles();
  if(!tiles.length){
    const p = document.createElement("p");
    p.className = "prize-empty";
    p.textContent = "Finish a game to win your first prize!";
    prizeStrip.appendChild(p);
    return;
  }
  tiles.forEach(tile => prizeStrip.appendChild(makeTile(tile, !merged)));
  prizeScroll.scrollTop = keepScroll;
  const focus = merged && prizeStrip.children[focusIndex];
  if(focus) focus.scrollIntoView({ block: "nearest" });
}

/** Keep the shelf one pixel off each end whenever a touch starts there.
 *  overscroll-behavior (prizeBox.css) already stops the flick from chaining
 *  out to the page on every engine that honours it; older iOS Safari doesn't,
 *  and reacts to a drag that begins at scrollTop 0 by dragging the *page* —
 *  which is the pull-to-refresh the child kept triggering. Starting the drag
 *  one pixel in means the shelf itself always has somewhere to go. */
function pinScroll(){
  const slack = prizeScroll.scrollHeight - prizeScroll.clientHeight;
  if(slack <= 0) return;                                   // nothing to scroll: leave it be
  if(prizeScroll.scrollTop <= 0) prizeScroll.scrollTop = 1;
  else if(prizeScroll.scrollTop >= slack) prizeScroll.scrollTop = slack - 1;
}

export function showPrizeBox(){
  renderPrizes();
  resetPrizeFx();
  resetPrizeMerge();
  prizeBox.classList.add("show");
}

function hidePrizeBox(){
  resetPrizeFx();
  resetPrizeMerge();
  prizeBox.classList.remove("show");
}

export function wirePrizeBox(){
  initPrizeMerge({ rerender: renderPrizes, prizeSound: playPrizeSound });
  prizeScroll.addEventListener("touchstart", pinScroll, { passive: true });
  prizeBoxBack.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); audio(); hidePrizeBox(); });
}
