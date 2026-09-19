// The prize box screen: a horizontally-scrolling shelf of every prize won so
// far. Reachable only from the theme-picker screen (see main.js wiring).

import { prizeBox, prizeBoxBack, prizeStrip } from "./dom.js";
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
  el.style.animation = "none"; void el.offsetWidth; // restart cleanly even mid-animation
  el.style.animation = `${name} ${dur}s ease`;
  el.addEventListener("animationend", () => { el.style.animation = ""; }, { once: true });
}

function renderPrizes(){
  prizeStrip.innerHTML = "";
  const tiles = getPrizeTiles();
  if(!tiles.length){
    const p = document.createElement("p");
    p.className = "prize-empty";
    p.textContent = "Finish a game to win your first prize!";
    prizeStrip.appendChild(p);
    return;
  }
  tiles.forEach(({ emoji, scale, perfect, hard }) => {
    // Two layers on purpose: the outer box is a stable grid cell that never
    // animates or moves, so its neighbors keep their position no matter what
    // happens to the emoji inside — only the inner face pops/scales/reacts.
    const cell = document.createElement("div");
    cell.className = "prize-tile" + (perfect ? " prize-perfect" : "");
    cell.style.setProperty("--scale", scale);

    const face = document.createElement("div");
    face.className = "prize-emoji";
    face.textContent = emoji;
    face.style.animation = "trophyPop .4s cubic-bezier(.34,1.56,.64,1)";
    face.addEventListener("animationend", () => { face.style.animation = ""; }, { once: true });
    cell.appendChild(face);

    if(hard){
      const badge = document.createElement("span");
      badge.className = "prize-hard-badge";
      badge.textContent = BONUS_GLYPH;
      cell.appendChild(badge);
    }

    cell.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); audio(); playTapAnim(face); playPrizeSound(emoji); });
    prizeStrip.appendChild(cell);
  });
}

export function showPrizeBox(){
  renderPrizes();
  prizeBox.classList.add("show");
}

function hidePrizeBox(){
  prizeBox.classList.remove("show");
}

export function wirePrizeBox(){
  prizeBoxBack.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); audio(); hidePrizeBox(); });
}
