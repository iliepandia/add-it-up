// Star crown: fills as questions are answered, highlights the active streak,
// and previews upcoming milestone badges.

import { GOAL, BONUS_GLYPH } from "./config.js";
import { starsEl } from "./dom.js";
import { sStar } from "./audio.js";
import { themeState } from "./themes.js";
import { state } from "./state.js";

export function buildStars(){
  starsEl.innerHTML="";
  for(let i=0;i<GOAL;i++){
    const slot=document.createElement("span"); slot.className="star-slot";
    const s=document.createElement("span"); s.className="star"; s.textContent="☆";
    slot.appendChild(s);
    starsEl.appendChild(slot);
  }
}

export function fillStar(i){
  const slot=starsEl.children[i]; if(!slot) return;
  const s=slot.querySelector(".star"); if(!s) return;
  s.textContent="★"; s.classList.add("filled","smash");
  s.addEventListener("animationend",()=>s.classList.remove("smash"),{once:true});
  sStar();
}

// The hard-mode bonus star is added hidden (so its flight target has a real
// position), then revealed once the flying star lands on it.
export function prepareBonusStar(i){
  const slot=starsEl.children[i]; if(!slot) return null;
  const b=document.createElement("span"); b.className="bonus-star"; b.textContent=BONUS_GLYPH;
  slot.appendChild(b);
  return b;
}
export function revealBonusStar(b){ if(!b) return; b.classList.add("show"); sStar(); }

function starIn(i){ return starsEl.children[i]?.querySelector(".star"); }

function updateStreakDisks(){
  for(let i=0;i<GOAL;i++){ starIn(i)?.classList.toggle("streak", i<state.starCount && i>=state.starCount-state.streak); }
}

function updateBadges(){
  const PRIZES=[[3,themeState.current.badges[0]],[6,themeState.current.badges[1]],[9,themeState.current.badges[2]]];
  for(let i=0;i<GOAL;i++){ const b=starIn(i)?.querySelector(".badge"); if(b) b.remove(); }
  for(const [M,glyph] of PRIZES){
    if(M>state.streak){
      const idx=state.starCount+(M-state.streak)-1;
      if(idx>=0 && idx<GOAL){ const b=document.createElement("span"); b.className="badge"; b.textContent=glyph; starIn(idx)?.appendChild(b); }
    }
  }
}

export function refreshStars(){ updateStreakDisks(); updateBadges(); }
