// The easy/hard difficulty toggle: one piece of shared state (state.mode),
// rendered identically on the theme-picker screen and at the top of the
// stats screen (same control in two places, not two independent settings).
// Hard mode is gated behind finishing at least one easy game, so there's
// always real easy-mode latency data (see hardDifficulty.js) before the
// water bar's speed is ever calculated.

import { state } from "./state.js";
import { hasCompletedEasyGame } from "./stats.js";
import { BONUS_GLYPH } from "./config.js";

export function canUseHard(){ return hasCompletedEasyGame(); }

export function renderDifficultyToggle(btn){
  if(!btn) return;
  const hard = state.mode === "hard";
  btn.textContent = hard ? BONUS_GLYPH : "👦";
  btn.classList.toggle("difficulty-hard", hard);
  btn.classList.toggle("difficulty-locked", !hard && !canUseHard());
  btn.setAttribute("aria-label", hard ? "Fast mode — tap for Easy" : "Easy mode — tap for Fast");
  btn.closest(".difficulty-row")?.querySelectorAll(".difficulty-label")
    .forEach(l => l.classList.toggle("active", l.dataset.mode === state.mode));
}

const FALL_STARS = 28;
let fallBuilt = false;

/** Fast mode adds a field of falling bikes to the theme picker only — layered
 *  over that screen's own background, never replacing any theme's. */
export function applyModeLook(){
  document.documentElement.classList.toggle("mode-hard", state.mode === "hard");
  if(fallBuilt) return;
  const layer = document.querySelector(".hard-fall");
  if(!layer) return;
  fallBuilt = true;
  for(let i = 0; i < FALL_STARS; i++){
    const s = document.createElement("span");
    s.className = "hard-star"; s.textContent = BONUS_GLYPH;
    s.style.setProperty("--f", Math.random().toFixed(3));
    s.style.animationDelay = `-${(Math.random() * 12).toFixed(2)}s`;
    layer.appendChild(s);
  }
}

/** Attempts to flip the mode. Returns true on success; false if switching to
 *  hard was blocked (no easy game finished yet) — the caller plays the
 *  denial feedback (shake/sound/hint) itself. */
export function attemptToggleMode(){
  if(state.mode === "easy"){
    if(!canUseHard()) return false;
    state.mode = "hard";
  }else{
    state.mode = "easy";
  }
  return true;
}
