// The prize box screen: a horizontally-scrolling shelf of every prize won so
// far. Reachable only from the theme-picker screen (see main.js wiring).

import { prizeBox, prizeBoxBack, prizeStrip } from "./dom.js";
import { audio } from "./audio.js";
import { pick } from "./config.js";
import { getPrizeTiles } from "./prizes.js";

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

    cell.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); audio(); playTapAnim(face); });
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
