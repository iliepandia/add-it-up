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
import { pick } from "./config.js";
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

function playPrizeSound(emoji){
  const fn = PRIZE_SOUND[emoji];
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
  tiles.forEach(({ emoji, scale, perfect }) => {
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
