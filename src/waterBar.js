// Hard mode's water bar (horizontal, under the problem card): starts full
// for every problem and drains
// over state.waterDrainMs (constant for the whole game, see hardDifficulty.js).
// Answering correctly before it empties earns the bonus star (see main.js).
// Purely visual — driven off state.problemShownAt, which problem.js already
// stamps fresh on every new problem and never touches on a wrong-answer retry,
// so the bar naturally resets per-problem and keeps draining through retries.

import { waterBarEl, waterFillEl, waterRiderEl, waterCakeEl } from "./dom.js";
import { state } from "./state.js";

let rafId = null;

export function waterRemainingFraction(){
  if(!state.waterDrainMs) return 1;
  const elapsed = performance.now() - state.problemShownAt;
  return Math.max(0, 1 - elapsed / state.waterDrainMs);
}

export function waterHasWater(){ return waterRemainingFraction() > 0; }

function tick(){
  if(!waterBarEl || waterBarEl.hidden){ rafId = null; return; }
  const frac = waterRemainingFraction();
  if(waterFillEl) waterFillEl.style.width = (frac * 100) + "%";
  // The biker rides the water's edge leftward, towards the cake parked at the
  // start of the bar. Run dry and he reaches it: both are gone.
  if(waterRiderEl){
    waterRiderEl.style.left = (frac * 100) + "%";
    waterRiderEl.hidden = frac <= 0;
  }
  if(waterCakeEl) waterCakeEl.hidden = frac <= 0;
  rafId = requestAnimationFrame(tick);
}

export function showWaterBar(){
  if(!waterBarEl) return;
  waterBarEl.hidden = false;
  if(waterCakeEl) waterCakeEl.hidden = false;
  if(!rafId) rafId = requestAnimationFrame(tick);
}

/** Stops the drain where it stands — used the instant a correct answer is
 *  committed, so the fill and its biker hold position through the
 *  celebration instead of draining on. The next problem refills them. */
export function freezeWaterBar(){
  if(rafId){ cancelAnimationFrame(rafId); rafId = null; }
}

/** The cake has been won and flown off to the star (see main.js), so it leaves
 *  the bar. The next problem's tick puts it back. */
export function takeWaterCake(){ if(waterCakeEl) waterCakeEl.hidden = true; }

export function hideWaterBar(){
  if(!waterBarEl) return;
  waterBarEl.hidden = true;
  freezeWaterBar();
}
