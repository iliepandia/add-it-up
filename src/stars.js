// Star crown: fills as questions are answered, highlights the active streak,
// and previews upcoming milestone badges.

import { GOAL } from "./config.js";
import { starsEl } from "./dom.js";
import { sStar } from "./audio.js";
import { themeState } from "./themes.js";
import { state } from "./state.js";

export function buildStars(){
  starsEl.innerHTML="";
  for(let i=0;i<GOAL;i++){ const s=document.createElement("span"); s.className="star"; s.textContent="☆"; starsEl.appendChild(s); }
}

export function fillStar(i){
  const s=starsEl.children[i]; if(!s) return;
  s.textContent="★"; s.classList.add("filled","smash");
  s.addEventListener("animationend",()=>s.classList.remove("smash"),{once:true});
  sStar();
}

function updateStreakDisks(){
  for(let i=0;i<GOAL;i++){ starsEl.children[i].classList.toggle("streak", i<state.starCount && i>=state.starCount-state.streak); }
}

function updateBadges(){
  const PRIZES=[[3,themeState.current.badges[0]],[6,themeState.current.badges[1]],[9,themeState.current.badges[2]]];
  for(let i=0;i<GOAL;i++){ const b=starsEl.children[i].querySelector(".badge"); if(b) b.remove(); }
  for(const [M,glyph] of PRIZES){
    if(M>state.streak){
      const idx=state.starCount+(M-state.streak)-1;
      if(idx>=0 && idx<GOAL){ const b=document.createElement("span"); b.className="badge"; b.textContent=glyph; starsEl.children[idx].appendChild(b); }
    }
  }
}

export function refreshStars(){ updateStreakDisks(); updateBadges(); }
