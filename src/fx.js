// Generic animation primitives: confetti-style particles, the star-flies-to-crown
// impact animation, and the little celebration bursts around correct/reveal.

import { rnd, pick, reduceMotion, HAPPY, STAR_FLY, IMPACT_AT } from "./config.js";
import { fx, ansEl, starsEl } from "./dom.js";
import { sParty } from "./audio.js";

export function spawnParticle(glyph,cx,cy,base,rng,parent){
  const p=document.createElement("div"); p.className="particle"; p.textContent=glyph;
  p.style.fontSize=(base+rnd(rng))+"px"; (parent||fx).appendChild(p);
  const ang=Math.random()*Math.PI*2, speed=6+Math.random()*9;
  let vx=Math.cos(ang)*speed, vy=Math.sin(ang)*speed-(7+Math.random()*5);
  let x=cx,y=cy,rot=rnd(360),vr=(Math.random()-0.5)*24;
  const g=0.45, life=1000+rnd(500), t0=performance.now();
  (function step(now){
    const dt=Math.min(32,now-(step.last||now)); step.last=now; const k=dt/16;
    vy+=g*k; x+=vx*k; y+=vy*k; rot+=vr*k; const age=now-t0;
    p.style.transform=`translate(${x}px,${y}px) rotate(${rot}deg)`;
    p.style.opacity = age>life*0.7 ? String(1-(age-life*0.7)/(life*0.3)) : "1";
    if(age<life && y<innerHeight+80) requestAnimationFrame(step); else p.remove();
  })(t0);
}

export function celebrate(){
  const glyph=pick(HAPPY); const n=reduceMotion?8:26; const cx=innerWidth/2, cy=innerHeight*0.42;
  for(let i=0;i<n;i++) spawnParticle(glyph,cx,cy,78,78);
  sParty();
}

export function tadaSparkles(){
  if(reduceMotion) return; const r=ansEl.getBoundingClientRect();
  const cx=r.left+r.width/2, cy=r.top+r.height/2;
  for(let i=0;i<10;i++) spawnParticle("✨",cx,cy,26,22);
}

export function flyStar(index,onImpact){
  const target=starsEl.children[index]; const tr=target.getBoundingClientRect();
  const tx=tr.left+tr.width/2, ty=tr.top+tr.height/2;
  const cx=innerWidth/2, cy=innerHeight*0.42;
  const targetPx=parseFloat(getComputedStyle(target).fontSize)||30;
  const BIG=Math.min(innerWidth,innerHeight)*0.6; const smallScale=targetPx/BIG;
  const mega=document.createElement("div"); mega.className="mega-star"; mega.textContent="★"; mega.style.fontSize=BIG+"px";
  document.body.appendChild(mega); const base="translate(-50%,-50%)";
  mega.animate([
    {transform:`translate(${cx}px,${cy}px) ${base} scale(1) rotate(-22deg)`, opacity:1, offset:0, easing:"ease-out"},
    {transform:`translate(${cx}px,${cy}px) ${base} scale(1) rotate(-12deg)`, opacity:1, offset:0.26, easing:"cubic-bezier(.55,0,.85,.5)"},
    {transform:`translate(${tx}px,${ty}px) ${base} scale(${smallScale}) rotate(6deg)`, opacity:1, offset:IMPACT_AT}
  ], {duration:STAR_FLY, fill:"forwards"});
  setTimeout(()=>{ onImpact(); impactRing(tx,ty); mega.remove(); }, STAR_FLY*IMPACT_AT);
}

function impactRing(x,y){
  const r=document.createElement("div"); r.className="ring";
  const sz=Math.min(innerWidth,innerHeight)*0.10;
  r.style.left=x+"px"; r.style.top=y+"px"; r.style.width=sz+"px"; r.style.height=sz+"px";
  document.body.appendChild(r);
  r.animate([{transform:"translate(-50%,-50%) scale(.3)",opacity:.85},{transform:"translate(-50%,-50%) scale(2.6)",opacity:0}],{duration:520,easing:"ease-out",fill:"forwards"});
  setTimeout(()=>r.remove(),560);
}
