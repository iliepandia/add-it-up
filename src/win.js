// End screen: trophy reveal + closing star explosion.

import { pick, reduceMotion, WIN_END } from "./config.js";
import { win, trophiesEl, winfxEl } from "./dom.js";
import { tone, sParty, sStar, sTada } from "./audio.js";
import { spawnParticle } from "./fx.js";
import { state } from "./state.js";

function starExplosion(){
  const n=reduceMotion?10:34, cx=innerWidth/2, cy=innerHeight*0.5;
  for(let i=0;i<n;i++) spawnParticle("⭐",cx,cy,50,44,winfxEl);
  sParty();
}

function popTrophy(el){
  el.removeEventListener("pointerdown", el._popHandler);
  const r=el.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  const isLast = trophiesEl.children.length<=1;
  if(isLast){
    if(!reduceMotion){
      const body=document.body;
      body.classList.remove("mega-shake"); void body.offsetWidth; body.classList.add("mega-shake");
      body.addEventListener("animationend",()=>body.classList.remove("mega-shake"),{once:true});
    }
    const n=reduceMotion?16:60;
    for(let i=0;i<n;i++) spawnParticle("⭐",cx,cy,80,70,winfxEl);
    sTada();
  }else{
    const n=reduceMotion?6:30;
    for(let i=0;i<n;i++) spawnParticle("⭐",cx,cy,38,30,winfxEl);
    sStar();
  }
  el.remove();
}

function makeTrophiesClickable(){
  trophiesEl.querySelectorAll(".trophy").forEach(el=>{
    el.classList.add("tap-ready");
    el._popHandler = e=>{ e.preventDefault(); e.stopPropagation(); popTrophy(el); };
    el.addEventListener("pointerdown", el._popHandler);
  });
}

function revealTrophies(glyph,count){
  trophiesEl.innerHTML="";
  const STEP=260, PENTA=[0,2,4,7,9,12,14,16,19,21];
  for(let i=0;i<count;i++) setTimeout(()=>{
    const e=document.createElement("span"); e.className="trophy"; e.textContent=glyph; trophiesEl.appendChild(e);
    const semi=PENTA[Math.min(i,PENTA.length-1)]; tone(523.25*Math.pow(2,semi/12),0,0.22,"triangle",0.14);
  }, i*STEP);
  setTimeout(()=>{ starExplosion(); makeTrophiesClickable(); }, count*STEP+250);
}

export function showWin(){
  win.classList.add("show");
  state.locked=true;
  revealTrophies(pick(WIN_END), Math.max(1,state.maxStreak));
}
