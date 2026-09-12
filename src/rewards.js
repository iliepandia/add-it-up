// Streak-milestone reward animations (rain of emoji, fly-across, float-up).
// These are generic effects; `themes.js` decides which theme fires which one.

import { rnd, pick, reduceMotion, FLYBY_DURATION } from "./config.js";
import { fx } from "./dom.js";

export function rainDown(emojis){
  if(reduceMotion) return;
  for(let i=0;i<40;i++) setTimeout(()=>{
    const p=document.createElement("div"); p.className="particle"; p.textContent=pick(emojis);
    p.style.fontSize=((30+rnd(26))*2)+"px"; fx.appendChild(p);
    let x=rnd(innerWidth), y=-70, vy=2.5+Math.random()*2.5, vx=(Math.random()-0.5)*2,
        rot=rnd(360), vr=(Math.random()-0.5)*10; const g=0.15, t0=performance.now(), life=3400;
    (function step(now){
      const dt=Math.min(32,now-(step.last||now)); step.last=now; const k=dt/16;
      vy+=g*k; y+=vy*k; x+=vx*k; rot+=vr*k; const age=now-t0;
      p.style.transform=`translate(${x}px,${y}px) rotate(${rot}deg)`;
      if(y<innerHeight+80 && age<life) requestAnimationFrame(step); else p.remove();
    })(t0);
  }, rnd(3000));
}

export function flyAcross(emoji, path){
  if(reduceMotion) return;
  const s=document.createElement("div"); s.className="flyby"; s.textContent=emoji;
  const min=Math.min(innerWidth,innerHeight); let size,sx,sy,ex,ey,ease="linear";
  if(path==="diagonal"){
    // Fly at a fixed angle from bottom-left to top-right, sized off the
    // screen's own diagonal so the angle looks the same on a tall phone
    // as on a wide desktop (not stretched/squashed by the aspect ratio).
    // sx/sy/ex/ey below are top-left coordinates, but cx/cy is the point
    // where the rocket's *center* should cross — so shift by -size/2 to
    // convert; the box is a large fraction of the screen, so skipping
    // this shift visibly throws the crossing point off-center.
    size=min*0.63;
    const angle=40*Math.PI/180;
    const dist=2*Math.max(innerWidth,innerHeight)+size*2;
    const dx=Math.cos(angle)*dist, dy=Math.sin(angle)*dist;
    const cx=innerWidth/2-size/2, cy=innerHeight/2-size/2;
    sx=cx-dx/2; sy=cy+dy/2; ex=cx+dx/2; ey=cy-dy/2;
    ease="cubic-bezier(.4,0,.6,1)";
  }
  else if(path==="sky"){ size=min*0.30; sx=innerWidth+size; sy=innerHeight*0.20; ex=-size; ey=innerHeight*0.16; }
  else { size=min*0.42; const cy=innerHeight*0.5-size*0.5; sx=innerWidth+size; sy=cy; ex=-size; ey=cy; }  // ground → across the middle
  s.style.fontSize=size+"px"; document.body.appendChild(s);
  s.animate([{transform:`translate(${sx}px,${sy}px)`,opacity:1},{transform:`translate(${ex}px,${ey}px)`,opacity:1}],
            {duration:FLYBY_DURATION, easing:ease, fill:"forwards"});
  setTimeout(()=>s.remove(),FLYBY_DURATION+100);
}

export function floatUp(emoji){
  if(reduceMotion) return;
  for(let i=0;i<40;i++) setTimeout(()=>{
    const p=document.createElement("div"); p.className="particle"; p.textContent=emoji;
    p.style.fontSize=(36+rnd(60))+"px"; fx.appendChild(p);
    let y=innerHeight+50, vy=-(2+Math.random()*2.5), x0=rnd(innerWidth),
        sway=24+rnd(34), phase=Math.random()*6.28; const t0=performance.now(), life=3400;
    (function step(now){
      const age=now-t0, dt=Math.min(32,now-(step.last||now)); step.last=now; const k=dt/16;
      y+=vy*k; const x=x0+Math.sin(age/300+phase)*sway;
      p.style.transform=`translate(${x}px,${y}px)`;
      p.style.opacity = age>life*0.6 ? String(0.9*(1-(age-life*0.6)/(life*0.4))) : "0.9";
      if(y>-70 && age<life) requestAnimationFrame(step); else p.remove();
    })(t0);
  }, rnd(3000));
}
