// End screen: trophy reveal + closing star explosion.

import { pick, rnd, reduceMotion, WIN_END } from "./config.js";
import { win, trophiesEl, winfxEl } from "./dom.js";
import { tone, sParty, sStar, sTada, sDing } from "./audio.js";
import { spawnParticle } from "./fx.js";
import { state } from "./state.js";
import { addPrize } from "./prizes.js";
import { startSnake } from "./snake.js";

function starExplosion(){
  const n=reduceMotion?10:34, cx=innerWidth/2, cy=innerHeight*0.5;
  for(let i=0;i<n;i++) spawnParticle("⭐",cx,cy,50,44,winfxEl);
  sParty();
}

function popTrophy(el){
  el.removeEventListener("pointerdown", el._popHandler);
  const r=el.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  const isLast = trophiesEl.querySelectorAll(".trophy").length<=1;
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

// A trophy the snake crawls into just shrinks away with a little "ding",
// distinct from the tap-to-pop celebration above.
function vanishTrophy(el){
  if(el.dataset.vanishing) return;
  el.dataset.vanishing="1";
  el.removeEventListener("pointerdown", el._popHandler);
  sDing();
  el.style.transition="transform .125s ease-in";
  el.style.transform="scale(0)";
  el.addEventListener("transitionend",()=>el.remove(),{once:true});
}

// Freezes every trophy's current on-screen position as absolute top/left, so
// removing one later (tap or snake touch) never reflows the rest — they'd
// otherwise re-pack via the flex-wrap layout used for the initial reveal.
function freezeTrophyLayout(){
  const rect=trophiesEl.getBoundingClientRect();
  const trophies=[...trophiesEl.querySelectorAll(".trophy")];
  // Read every trophy's position first, *then* write — freezing one to
  // position:absolute pulls it out of the flex-wrap flow immediately, which
  // would reflow (and bunch up) any trophy read afterward.
  const rects=trophies.map(el=>el.getBoundingClientRect());
  trophiesEl.style.position="relative";
  trophiesEl.style.width=rect.width+"px";
  trophiesEl.style.height=rect.height+"px";
  trophies.forEach((el,i)=>{
    const r=rects[i];
    el.style.position="absolute";
    el.style.left=(r.left-rect.left)+"px";
    el.style.top=(r.top-rect.top)+"px";
    el.style.margin="0";
  });
}

function makeTrophiesClickable(){
  trophiesEl.querySelectorAll(".trophy").forEach(el=>{
    el.classList.add("tap-ready");
    el._popHandler = e=>{ e.preventDefault(); e.stopPropagation(); popTrophy(el); };
    el.addEventListener("pointerdown", el._popHandler);
  });
}

function revealTrophies(glyph,count){
  trophiesEl.style.cssText="";
  trophiesEl.innerHTML="";
  const STEP=260, PENTA=[0,2,4,7,9,12,14,16,19,21];
  for(let i=0;i<count;i++) setTimeout(()=>{
    const e=document.createElement("span"); e.className="trophy"; e.textContent=glyph; trophiesEl.appendChild(e);
    const semi=PENTA[Math.min(i,PENTA.length-1)]; tone(523.25*Math.pow(2,semi/12),0,0.22,"triangle",0.14);
  }, i*STEP);
  setTimeout(()=>{ starExplosion(); freezeTrophyLayout(); makeTrophiesClickable(); trophiesReady=true; }, count*STEP+250);
}

// The snake reports its current segments (viewport-pixel rects) on every
// step; a trophy it overlaps vanishes. Only armed once trophies are frozen
// in place (see freezeTrophyLayout), so a touch never fights the reveal.
let trophiesReady=false;
function onSnakeStep(segments){
  if(!trophiesReady) return;
  trophiesEl.querySelectorAll(".trophy:not([data-vanishing])").forEach(el=>{
    const r=el.getBoundingClientRect();
    const hit=segments.some(s => s.x<r.right && s.x+s.w>r.left && s.y<r.bottom && s.y+s.h>r.top);
    if(hit) vanishTrophy(el);
  });
}

export function showWin(){
  win.classList.add("show");
  state.locked=true;
  trophiesReady=false;
  const glyph=pick(WIN_END);
  const score=Math.max(0,10-state.gameWrongTotal);
  addPrize(glyph,score); // exactly one prize per finished game, into the persistent prize box
  if(score>=10 && rnd(3)===0) startSnake(onSnakeStep); // perfect game: 1-in-3 chance of the crawling snake easter egg
  revealTrophies(glyph, Math.max(1,state.maxStreak));
}
