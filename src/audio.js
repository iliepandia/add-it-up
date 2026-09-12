// Synthesized sound effects (no audio files) via the Web Audio API.

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

export function sZoom(){   // rocket / spaceship whoosh (doppler-ish pass)
  const c=audio(); if(!c) return; const t=c.currentTime, dur=1.3, buf=noiseBuffer(dur); if(!buf) return;
  const src=c.createBufferSource(); src.buffer=buf;
  const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=1.2;
  bp.frequency.setValueAtTime(400,t);
  bp.frequency.exponentialRampToValueAtTime(3000,t+dur*0.45);
  bp.frequency.exponentialRampToValueAtTime(300,t+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t);
  g.gain.linearRampToValueAtTime(0.16,t+dur*0.35); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(bp).connect(g).connect(c.destination); src.start(t); src.stop(t+dur);
}

export function sRumble(){  // tractor engine chug
  const c=audio(); if(!c) return; const t=c.currentTime, dur=2.2;
  const o=c.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(72,t); o.frequency.linearRampToValueAtTime(64,t+dur);
  const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=380;
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.12,t+0.15);
  const chug=0.16; for(let tt=t+0.15; tt<t+dur-0.2; tt+=chug){ g.gain.linearRampToValueAtTime(0.05,tt+chug/2); g.gain.linearRampToValueAtTime(0.12,tt+chug); }
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(lp).connect(g).connect(c.destination); o.start(t); o.stop(t+dur+0.05);
}

export function sChirp(){   // bird passing tweets
  const c=audio(); if(!c) return; const t=c.currentTime;
  [0,0.18,0.36].forEach((off,i)=>{
    const o=c.createOscillator(), g=c.createGain(); o.type="sine"; const f=1800+i*200;
    o.frequency.setValueAtTime(f,t+off);
    o.frequency.exponentialRampToValueAtTime(f*1.5,t+off+0.06);
    o.frequency.exponentialRampToValueAtTime(f*0.9,t+off+0.12);
    g.gain.setValueAtTime(0.0001,t+off); g.gain.linearRampToValueAtTime(0.10,t+off+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t+off+0.14);
    o.connect(g).connect(c.destination); o.start(t+off); o.stop(t+off+0.16);
  });
}
