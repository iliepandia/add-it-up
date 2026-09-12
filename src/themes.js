// Theme definitions (visuals, sounds, badge glyphs, milestone rewards)
// and the currently-active theme.

import { rnd, CATS } from "./config.js";
import { sClick, sDing, sSqueak, sZoom, sRumble, sChirp } from "./audio.js";
import { rainDown, flyAcross, floatUp } from "./rewards.js";
import { starfieldLayer } from "./dom.js";
import { state } from "./state.js";

export const THEMES = {
  classic:{cls:"theme-classic", click:sClick, badges:["🍬","🚀","🫧"], emojiCats:CATS,
    r3:()=>rainDown(["🍬","🍭","🧁","🍫","🍩","🍪","🍡"]), r6:()=>{flyAcross("🚀","diagonal"); sZoom();}, r9:()=>floatUp("🫧")},
  nature:{cls:"theme-nature", click:sClick, badges:["🍂","🐦","🍦"], emojiCats:["nature"],
    r3:()=>rainDown(["🍂","🍁"]), r6:()=>{flyAcross("🐦","sky"); sChirp();}, r9:()=>floatUp("🍦")},
  space:{cls:"theme-space", click:sDing, badges:["⭐","🚀","🌋"], emojiCats:["space"],
    r3:()=>rainDown(["⭐","🌟"]), r6:()=>{flyAcross("🚀","diagonal"); sZoom();}, r9:()=>floatUp("🌋")},
  animal:{cls:"theme-animal", click:sSqueak, badges:["🍎","🚜","🐝"], emojiCats:["fruit","animals","birds"],
    r3:()=>rainDown(["🍎"]), r6:()=>{flyAcross("🚜","ground"); sRumble();}, r9:()=>floatUp("🐝")}
};

export const themeState = { current: THEMES.classic };

export function applyTheme(name){
  themeState.current = THEMES[name] || THEMES.classic;
  document.body.className = themeState.current.cls;
  if(name==="space") buildStarfield(); else clearStarfield();
}

function buildStarfield(){
  if(!starfieldLayer) return; starfieldLayer.innerHTML="";
  for(let i=0;i<44;i++){ const d=document.createElement("div"); d.className="starDot";
    d.style.left=rnd(100)+"%"; d.style.top=rnd(100)+"%"; const sz=1+rnd(3);
    d.style.width=sz+"px"; d.style.height=sz+"px";
    d.style.animationDuration=(3+Math.random()*3)+"s"; d.style.animationDelay=(Math.random()*3)+"s";
    starfieldLayer.appendChild(d);
  }
}
function clearStarfield(){ if(starfieldLayer) starfieldLayer.innerHTML=""; }

export function checkStreak(){
  if(state.streak===3) themeState.current.r3();
  else if(state.streak===6) themeState.current.r6();
  else if(state.streak===9) themeState.current.r9();
}
