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

// Pitch-bend a single oscillator from f0 to f1 — the animal-call building block below.
function sweep(f0,f1,dur,type="sine",gain=0.14,delay=0){
  const c=audio(); if(!c) return; const t=c.currentTime+delay;
  const o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.setValueAtTime(f0,t);
  o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(gain,t+Math.min(0.02,dur*0.2));
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

// ---- prize-box tap sounds ----
// One little synth per "family" of prize (animal call, vehicle noise, food
// pop, toy sound, nature chime...) so tapping a prize sounds like that prize
// instead of a random blip — see PRIZE_SOUND in prizeBox.js for the mapping
// from each of the 60 WIN_END emoji to one of these.

export function tapMoo(){ sweep(180,90,0.5,"sawtooth",0.15); }
export function tapBark(){ tone(300,0,0.09,"square",0.16); tone(260,0.11,0.09,"square",0.14); }
export function tapMeow(){ sweep(500,780,0.11,"sine",0.13); sweep(780,480,0.13,"sine",0.11,0.12); }
export function tapOink(){ tone(220,0,0.08,"sawtooth",0.15); tone(180,0.09,0.1,"sawtooth",0.15); }
export function tapQuack(){ sweep(500,300,0.1,"sawtooth",0.14); sweep(460,260,0.09,"sawtooth",0.12,0.11); }
export function tapNeigh(){ sweep(300,700,0.15,"sawtooth",0.13); sweep(700,350,0.25,"sawtooth",0.12,0.15); }
export function tapRoar(){ sweep(140,70,0.45,"sawtooth",0.16); }
export function tapRibbit(){ tone(220,0,0.06,"square",0.13); tone(180,0.07,0.09,"square",0.15); }
export function tapHoot(){ tone(500,0,0.16,"sine",0.12); tone(420,0.2,0.2,"sine",0.11); }
export function tapHop(){ sweep(600,900,0.08,"sine",0.12); sweep(900,600,0.08,"sine",0.10,0.09); }
export function tapYip(){ sweep(700,1000,0.07,"triangle",0.13); sweep(1000,650,0.08,"triangle",0.11,0.08); }
export function tapBoop(){ tone(500,0,0.12,"sine",0.12); tone(650,0.1,0.14,"sine",0.10); }
export function tapPenguinHonk(){ tone(260,0,0.08,"square",0.14); tone(300,0.09,0.08,"square",0.13); }
export function tapSquawk(){ sweep(900,500,0.13,"sawtooth",0.13); }
export function tapTurtleBlip(){ tone(300,0,0.18,"sine",0.10); }
export function tapLadybugChirp(){ tone(1400,0,0.05,"sine",0.10); tone(1700,0.06,0.05,"sine",0.08); }
export function tapDolphinClick(){ tone(2200,0,0.03,"sine",0.10); tone(2400,0.05,0.03,"sine",0.08); sweep(1200,2000,0.12,"sine",0.09,0.11); }
export function tapWhaleCall(){ sweep(220,110,0.6,"sine",0.13); }
export function tapUnicornSparkle(){ [1400,1800,2200,2600].forEach((f,i)=>tone(f,i*0.05,0.18,"sine",0.09)); }

export function tapFlutterBuzz(){   // butterfly / bee: a brief version of sBeeBuzz's tremolo
  const c=audio(); if(!c) return; const t=c.currentTime;
  const o=c.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(220,t); o.frequency.linearRampToValueAtTime(340,t+0.25);
  const trem=c.createOscillator(); trem.type="sine"; trem.frequency.value=28;
  const tremGain=c.createGain(); tremGain.gain.value=0.05;
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.09,t+0.05); g.gain.exponentialRampToValueAtTime(0.0001,t+0.3);
  trem.connect(tremGain).connect(g.gain); o.connect(g).connect(c.destination);
  o.start(t); o.stop(t+0.32); trem.start(t); trem.stop(t+0.32);
}

export function tapOctopusBlub(){
  const c=audio(); if(!c) return; const t=c.currentTime;
  [0,0.09,0.18].forEach((off,i)=>{
    const o=c.createOscillator(), g=c.createGain(); o.type="sine"; const f=260-i*40;
    o.frequency.setValueAtTime(f,t+off); o.frequency.exponentialRampToValueAtTime(f*1.6,t+off+0.08);
    g.gain.setValueAtTime(0.0001,t+off); g.gain.linearRampToValueAtTime(0.10,t+off+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+off+0.1);
    o.connect(g).connect(c.destination); o.start(t+off); o.stop(t+off+0.12);
  });
}

// ---- vehicles ----
export function tapRocketWhoosh(){
  const c=audio(); if(!c) return; const t=c.currentTime, dur=0.4, buf=noiseBuffer(dur); if(!buf) return;
  const src=c.createBufferSource(); src.buffer=buf;
  const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=1.1;
  bp.frequency.setValueAtTime(500,t); bp.frequency.exponentialRampToValueAtTime(2600,t+dur*0.6); bp.frequency.exponentialRampToValueAtTime(400,t+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.15,t+dur*0.3); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(bp).connect(g).connect(c.destination); src.start(t); src.stop(t+dur);
}
export function tapBikeBell(){ tone(1800,0,0.08,"sine",0.13); tone(1800,0.1,0.14,"sine",0.10); }
export function tapCarHonk(){ tone(320,0,0.16,"square",0.14); tone(320,0.18,0.16,"square",0.14); }
export function tapTrainChug(){ tone(140,0,0.09,"sawtooth",0.13); tone(140,0.12,0.09,"sawtooth",0.13); tone(700,0.24,0.22,"sine",0.10); }

export function tapHeliWhir(){
  const c=audio(); if(!c) return; const t=c.currentTime;
  const carrier=c.createOscillator(); carrier.type="sawtooth"; carrier.frequency.value=180;
  const am=c.createOscillator(); am.type="square"; am.frequency.value=18;
  const amGain=c.createGain(); amGain.gain.value=0.1;
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.12,t+0.05); g.gain.exponentialRampToValueAtTime(0.0001,t+0.35);
  am.connect(amGain).connect(g.gain);
  carrier.connect(g).connect(c.destination);
  carrier.start(t); carrier.stop(t+0.35); am.start(t); am.stop(t+0.35);
}
export function tapSailWhoosh(){
  const c=audio(); if(!c) return; const t=c.currentTime, dur=0.35, buf=noiseBuffer(dur); if(!buf) return;
  const src=c.createBufferSource(); src.buffer=buf;
  const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=0.6; bp.frequency.setValueAtTime(700,t); bp.frequency.linearRampToValueAtTime(1100,t+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.09,t+0.08); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(bp).connect(g).connect(c.destination); src.start(t); src.stop(t+dur);
}
export function tapUfoWarble(){
  const c=audio(); if(!c) return; const t=c.currentTime;
  const o=c.createOscillator(); o.type="sine"; o.frequency.setValueAtTime(600,t);
  for(let i=0;i<6;i++) o.frequency.linearRampToValueAtTime(i%2 ? 900 : 500, t+0.05*(i+1));
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.11,t+0.03); g.gain.exponentialRampToValueAtTime(0.0001,t+0.34);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t+0.36);
}

// ---- toys & objects ----
export function tapBalloonSqueak(){ sweep(400,900,0.14,"sawtooth",0.10); }
export function tapGiftRustle(){ tone(1500,0,0.05,"sine",0.08); tone(1800,0.06,0.05,"sine",0.07); tone(2100,0.12,0.12,"sine",0.09); }
export function tapTeddySqueak(){ tone(700,0,0.07,"triangle",0.10); tone(650,0.09,0.09,"triangle",0.09); }
export function tapConfettiPop(){
  const c=audio(); if(!c) return; const t=c.currentTime, buf=noiseBuffer(0.08); if(!buf) return;
  const src=c.createBufferSource(); src.buffer=buf;
  const g=c.createGain(); g.gain.setValueAtTime(0.16,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.08);
  src.connect(g).connect(c.destination); src.start(t); src.stop(t+0.08);
  [1600,2000,2400].forEach((f,i)=>tone(f,0.05+i*0.04,0.12,"sine",0.07));
}
export function tapKiteFlutter(){
  const c=audio(); if(!c) return; const t=c.currentTime, dur=0.3, buf=noiseBuffer(dur); if(!buf) return;
  const src=c.createBufferSource(); src.buffer=buf;
  const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=1.4; bp.frequency.setValueAtTime(1400,t); bp.frequency.linearRampToValueAtTime(2000,t+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.06,t+0.05); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(bp).connect(g).connect(c.destination); src.start(t); src.stop(t+dur);
}
export function tapYoyoBoing(){ sweep(300,150,0.1,"triangle",0.12); sweep(150,320,0.12,"triangle",0.10,0.1); }
export function tapBallThump(){ tone(120,0,0.09,"sine",0.16); }
export function tapPaintSwish(){ sweep(900,1400,0.14,"triangle",0.09); }
export function tapCastleFanfare(){ [523.25,659.25,783.99].forEach((f,i)=>tone(f,i*0.08,0.22,"triangle",0.11)); }

export function tapCircusDrumroll(){
  const c=audio(); if(!c) return; const t=c.currentTime, hits=8, span=0.3;
  for(let i=0;i<hits;i++){
    const start=t+(i/hits)*span, buf=noiseBuffer(0.03); if(!buf) continue;
    const src=c.createBufferSource(); src.buffer=buf;
    const g=c.createGain(); g.gain.setValueAtTime(0.1,start); g.gain.exponentialRampToValueAtTime(0.0001,start+0.03);
    src.connect(g).connect(c.destination); src.start(start); src.stop(start+0.03);
  }
  tone(700,span,0.18,"triangle",0.12);
}
export function tapCarouselTinkle(){ [1046.5,1318.5,1568,2093].forEach((f,i)=>tone(f,i*0.06,0.16,"sine",0.08)); }
export function tapFerrisChime(){ [659.25,880,1108.7].forEach((f,i)=>tone(f,i*0.09,0.3,"sine",0.09)); }

// ---- food & sweets ----
export function tapCakeTada(){ tone(523.25,0,0.14,"triangle",0.11); tone(659.25,0.1,0.14,"triangle",0.11); tone(783.99,0.2,0.26,"triangle",0.12); }
export function tapIceCreamSwirl(){ sweep(700,1300,0.22,"sine",0.09); }
export function tapMelonThud(){ tone(130,0,0.1,"sine",0.15); tone(700,0.03,0.05,"triangle",0.06); }
export function tapBerryPop(){ tone(900,0,0.06,"sine",0.12); tone(1300,0.05,0.05,"sine",0.09); }
export function tapLollipopTwinkle(){ [1500,1900,2300].forEach((f,i)=>tone(f,i*0.05,0.14,"sine",0.09)); }
export function tapDonutSquish(){ tone(260,0,0.08,"triangle",0.12); tone(300,0.07,0.08,"triangle",0.10); }
export function tapCupcakeSparkle(){ [1568,1976,2349].forEach((f,i)=>tone(f,i*0.06,0.16,"sine",0.08)); }

export function tapCookieCrunch(){
  const c=audio(); if(!c) return; const t=c.currentTime, buf=noiseBuffer(0.09); if(!buf) return;
  const src=c.createBufferSource(); src.buffer=buf;
  const hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=1500;
  const g=c.createGain(); g.gain.setValueAtTime(0.14,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.09);
  src.connect(hp).connect(g).connect(c.destination); src.start(t); src.stop(t+0.09);
}

// ---- nature & sky ----
export function tapRainbowShimmer(){ [659.25,783.99,987.77,1174.66].forEach((f,i)=>tone(f,i*0.06,0.2,"sine",0.09)); }
export function tapSunGlow(){ tone(523.25,0,0.3,"sine",0.10); tone(659.25,0.08,0.3,"sine",0.08); }
export function tapBloomChime(){ tone(880,0,0.16,"sine",0.10); tone(1108.7,0.1,0.2,"sine",0.09); }
export function tapMushroomBoop(){ sweep(200,400,0.1,"triangle",0.12); }

export function tapTreeRustleTap(){
  const c=audio(); if(!c) return; const t=c.currentTime, dur=0.3, buf=noiseBuffer(dur); if(!buf) return;
  const src=c.createBufferSource(); src.buffer=buf;
  const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=0.7; bp.frequency.value=2000;
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.07,t+0.05); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(bp).connect(g).connect(c.destination); src.start(t); src.stop(t+dur);
}
