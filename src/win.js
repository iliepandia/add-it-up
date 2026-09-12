// End screen: trophy reveal + closing star explosion.

import { pick, reduceMotion, WIN_END } from "./config.js";
import { win, trophiesEl, winfxEl } from "./dom.js";
import { tone, sParty } from "./audio.js";
import { spawnParticle } from "./fx.js";
import { state } from "./state.js";

function starExplosion(){
  const n=reduceMotion?10:34, cx=innerWidth/2, cy=innerHeight*0.5;
  for(let i=0;i<n;i++) spawnParticle("⭐",cx,cy,50,44,winfxEl);
  sParty();
}

function revealTrophies(glyph,count){
  trophiesEl.innerHTML="";
  const STEP=260, PENTA=[0,2,4,7,9,12,14,16,19,21];
  for(let i=0;i<count;i++) setTimeout(()=>{
    const e=document.createElement("span"); e.className="trophy"; e.textContent=glyph; trophiesEl.appendChild(e);
    const semi=PENTA[Math.min(i,PENTA.length-1)]; tone(523.25*Math.pow(2,semi/12),0,0.22,"triangle",0.14);
  }, i*STEP);
  setTimeout(starExplosion, count*STEP+250);
}

export function showWin(){
  win.classList.add("show");
  state.locked=true;
  revealTrophies(pick(WIN_END), Math.max(1,state.maxStreak));
}
