// Synthesized sound effects (no audio files) via the Web Audio API.

import { FLYBY_DURATION, REWARD_SHOWER_DURATION } from "./config.js";

let ac = null;
export function audio(){
  if(ac){ if(ac.state==="suspended") ac.resume(); return ac; }
  try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ac=null; }
  return ac;
}

export function tone(freq,start,dur,type="sine",gain=0.14){
  const c=audio(); if(!c) return; const t=c.currentTime+start;
  const o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t+dur+0.02);
}

export const sClick = () => tone(700+Math.floor(Math.random()*120),0,0.07,"triangle",0.10);
export const sDing = () => { tone(1245,0,0.35,"sine",0.14); tone(1868,0,0.30,"sine",0.05); };

export function sSqueak(){
  const c=audio(); if(!c) return; const t=c.currentTime;
  const o=c.createOscillator(), g=c.createGain(); o.type="sawtooth";
  o.frequency.setValueAtTime(520,t);
  o.frequency.exponentialRampToValueAtTime(1500,t+0.08);
  o.frequency.exponentialRampToValueAtTime(720,t+0.16);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.12,t+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t+0.2);
}

export function sParty(){ [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,i*0.09,0.28,"triangle",0.13)); }
export function sError(){ tone(392,0,0.16,"sine",0.14); tone(392,0.18,0.16,"sine",0.14); }
export const sStar = () => { tone(1318.5,0,0.18,"sine",0.13); tone(1975.5,0.02,0.16,"sine",0.06); };
export function sTada(){ tone(392,0,0.12,"triangle",0.12); [523.25,659.25,783.99].forEach(f=>tone(f,0.12,0.66,"triangle",0.11)); tone(1046.5,0.12,0.66,"sine",0.05); }

function noiseBuffer(dur){
  const c=audio(); if(!c) return null;
  const len=Math.floor(c.sampleRate*dur), buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=Math.random()*2-1; return buf;
}

export function sZoom(){   // rocket / spaceship whoosh (doppler-ish pass), timed to the fly-across animation
  const c=audio(); if(!c) return; const t=c.currentTime, dur=FLYBY_DURATION/1000, buf=noiseBuffer(dur); if(!buf) return;
  const src=c.createBufferSource(); src.buffer=buf;
  const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=1.2;
  bp.frequency.setValueAtTime(400,t);
  bp.frequency.exponentialRampToValueAtTime(3000,t+dur*0.45);
  bp.frequency.exponentialRampToValueAtTime(300,t+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t);
  g.gain.linearRampToValueAtTime(0.16,t+dur*0.35); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(bp).connect(g).connect(c.destination); src.start(t); src.stop(t+dur);
}

export function sRumble(){  // tractor engine chug, timed to the fly-across animation
  const c=audio(); if(!c) return; const t=c.currentTime, dur=FLYBY_DURATION/1000;
  const o=c.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(72,t); o.frequency.linearRampToValueAtTime(64,t+dur);
  const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=380;
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.12,t+0.15);
  const chug=0.16; for(let tt=t+0.15; tt<t+dur-0.2; tt+=chug){ g.gain.linearRampToValueAtTime(0.05,tt+chug/2); g.gain.linearRampToValueAtTime(0.12,tt+chug); }
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(lp).connect(g).connect(c.destination); o.start(t); o.stop(t+dur+0.05);
}

export function sChirp(){   // bird passing tweets, repeated in bursts across the fly-across animation
  const c=audio(); if(!c) return; const t=c.currentTime;
  const span=FLYBY_DURATION/1000, bursts=5, gap=(span-0.5)/(bursts-1);
  for(let b=0;b<bursts;b++){
    const bt=b*gap;
    [0,0.18,0.36].forEach((off,i)=>{
      const o=c.createOscillator(), g=c.createGain(); o.type="sine"; const f=1800+i*200;
      const start=t+bt+off;
      o.frequency.setValueAtTime(f,start);
      o.frequency.exponentialRampToValueAtTime(f*1.5,start+0.06);
      o.frequency.exponentialRampToValueAtTime(f*0.9,start+0.12);
      g.gain.setValueAtTime(0.0001,start); g.gain.linearRampToValueAtTime(0.10,start+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,start+0.14);
      o.connect(g).connect(c.destination); o.start(start); o.stop(start+0.16);
    });
  }
}

// ---- streak 3 / streak 9 reward sounds (one per theme, see main.js summary) ----
// The rainDown/floatUp particle showers run up to REWARD_SHOWER_DURATION (particles
// spawn staggered over ~3s, each living ~3.4s) — these sounds are stretched or
// repeated to match instead of cutting out while particles are still falling/rising.

export function sCandyChime(){   // classic r3: candy rain — bright arpeggio, repeating as candy keeps falling
  const notes=[987.77,1174.66,1318.51,1567.98];
  const span=REWARD_SHOWER_DURATION/1000, reps=6, gap=span/reps;
  for(let r=0;r<reps;r++){
    const base=r*gap;
    notes.forEach((f,i)=>tone(f,base+i*0.09,0.32,"triangle",0.10));
  }
}

export function sBubbles(){   // classic r9: bubbles float up — soft rising bloops, in staggered bursts
  const c=audio(); if(!c) return; const t=c.currentTime;
  const span=REWARD_SHOWER_DURATION/1000, bursts=7, gap=span/bursts;
  for(let b=0;b<bursts;b++){
    const bt=b*gap;
    [0,0.14,0.28,0.42].forEach((off,i)=>{
      const o=c.createOscillator(), g=c.createGain(); o.type="sine"; const f=300+i*70;
      const start=t+bt+off;
      o.frequency.setValueAtTime(f,start);
      o.frequency.exponentialRampToValueAtTime(f*2.2,start+0.18);
      g.gain.setValueAtTime(0.0001,start); g.gain.linearRampToValueAtTime(0.10,start+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,start+0.2);
      o.connect(g).connect(c.destination); o.start(start); o.stop(start+0.22);
    });
  }
}

export function sRustle(){   // nature r3: leaves fall — continuous wind-through-leaves rustle for the whole shower
  const c=audio(); if(!c) return; const t=c.currentTime, dur=REWARD_SHOWER_DURATION/1000, buf=noiseBuffer(dur); if(!buf) return;
  const src=c.createBufferSource(); src.buffer=buf;
  const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=0.7;
  bp.frequency.setValueAtTime(1800,t); bp.frequency.linearRampToValueAtTime(2600,t+dur);
  const trem=c.createOscillator(); trem.type="sine"; trem.frequency.value=2.2;
  const tremGain=c.createGain(); tremGain.gain.value=0.03;
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t);
  g.gain.linearRampToValueAtTime(0.075,t+0.3); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  trem.connect(tremGain).connect(g.gain);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t); src.stop(t+dur); trem.start(t); trem.stop(t+dur);
}

export function sJingle(){   // nature r9: ice cream floats up — cheerful truck-jingle tune, looping like a real one
  const melody=[783.99,987.77,1046.5,1318.51];
  const span=REWARD_SHOWER_DURATION/1000, reps=4, gap=span/reps;
  for(let r=0;r<reps;r++){
    const base=r*gap;
    melody.forEach((f,i)=>tone(f,base+i*0.14,0.3,"triangle",0.10));
  }
}

export function sTwinkleCascade(){   // space r3: stars fall — glittering cascade across the whole shower
  const span=REWARD_SHOWER_DURATION/1000, count=26;
  for(let i=0;i<count;i++) tone(1600+Math.random()*900, Math.random()*span, 0.22, "sine", 0.07);
}

export function sLavaBubble(){   // space r9: volcanoes float up — low bubbling rumble, repeating as they keep rising
  const c=audio(); if(!c) return; const t=c.currentTime;
  const span=REWARD_SHOWER_DURATION/1000, reps=7, gap=span/reps;
  for(let r=0;r<reps;r++){
    const base=r*gap;
    [0,0.22,0.46].forEach((off,i)=>{
      const o=c.createOscillator(), g=c.createGain(); o.type="sawtooth"; const f=90-i*10;
      const start=t+base+off;
      o.frequency.setValueAtTime(f,start);
      o.frequency.exponentialRampToValueAtTime(f*0.6,start+0.3);
      const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=220;
      g.gain.setValueAtTime(0.0001,start); g.gain.linearRampToValueAtTime(0.12,start+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001,start+0.32);
      o.connect(lp).connect(g).connect(c.destination); o.start(start); o.stop(start+0.34);
    });
  }
}

export function sAppleThud(){   // animal r3: apples rain — plunky thuds, continuing as apples keep dropping
  const c=audio(); if(!c) return; const t=c.currentTime;
  const span=REWARD_SHOWER_DURATION/1000, hits=16;
  for(let i=0;i<hits;i++){
    const start=t+Math.random()*span;
    const o=c.createOscillator(), g=c.createGain(); o.type="triangle"; const f=160+Math.random()*40;
    o.frequency.setValueAtTime(f,start);
    o.frequency.exponentialRampToValueAtTime(f*0.6,start+0.1);
    g.gain.setValueAtTime(0.0001,start); g.gain.linearRampToValueAtTime(0.13,start+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,start+0.12);
    o.connect(g).connect(c.destination); o.start(start); o.stop(start+0.14);
  }
}

export function sBeeBuzz(){   // animal r9: bees float up — buzzing tremolo, sustained the whole time they rise
  const c=audio(); if(!c) return; const t=c.currentTime, dur=REWARD_SHOWER_DURATION/1000;
  const o=c.createOscillator(); o.type="sawtooth";
  o.frequency.setValueAtTime(180,t); o.frequency.linearRampToValueAtTime(320,t+dur);
  const trem=c.createOscillator(); trem.type="sine"; trem.frequency.value=26;
  const tremGain=c.createGain(); tremGain.gain.value=0.04;
  const mainGain=c.createGain(); mainGain.gain.setValueAtTime(0.0001,t);
  mainGain.gain.linearRampToValueAtTime(0.07,t+0.15);
  mainGain.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  trem.connect(tremGain).connect(mainGain.gain);
  o.connect(mainGain).connect(c.destination);
  o.start(t); o.stop(t+dur+0.05);
  trem.start(t); trem.stop(t+dur+0.05);
}
