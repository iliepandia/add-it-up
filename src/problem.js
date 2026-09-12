// Problem generation and rendering (digits / emoji groups / dice-domino pips).

import { rnd, pick, EMOJI, PIPS } from "./config.js";
import { opA, opB, ansEl } from "./dom.js";
import { state } from "./state.js";
import { themeState } from "./themes.js";

function pipCard(v){
  const el=document.createElement("div"); el.className="pip-card "+state.pipStyle;
  const on=new Set(PIPS[v]);
  for(let i=0;i<9;i++){ const d=document.createElement("div"); d.className="pip "+(on.has(i)?"on":"off"); el.appendChild(d); }
  return el;
}
function emojiGroup(v,glyph){
  const g=document.createElement("div"); g.className="emoji-group";
  // Cap at 2 rows regardless of screen width, so a large operand (up to 9)
  // never wraps onto enough lines to push the keypad off-screen.
  const cols = v<=4 ? v : Math.ceil(v/2);
  g.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  if(v>4){
    const vw = Math.max(3, 8-cols);
    const maxPx = Math.max(18, 50-cols*6);
    g.style.setProperty("--emoji-size", `clamp(16px, ${vw}vw, ${maxPx}px)`);
  }
  for(let i=0;i<v;i++){ const s=document.createElement("span"); s.textContent=glyph; g.appendChild(s); }
  return g;
}
function numEl(v,cls){ const s=document.createElement("div"); s.className="num"+(cls?" "+cls:""); s.textContent=v; return s; }

function render(){
  opA.innerHTML=""; opB.innerHTML="";
  if(state.presentation==="digits"){ opA.appendChild(numEl(state.a)); opB.appendChild(numEl(state.b)); }
  else if(state.presentation==="emoji"){ const glyph=pick(EMOJI[pick(themeState.current.emojiCats)]); opA.appendChild(emojiGroup(state.a,glyph)); opB.appendChild(emojiGroup(state.b,glyph)); }
  else{ state.pipStyle=Math.random()<0.5?"dice":"domino"; opA.appendChild(pipCard(state.a)); opB.appendChild(pipCard(state.b)); }
  renderAns();
}

export function renderAns(reveal){
  ansEl.innerHTML="";
  if(state.entry===""){ const c=document.createElement("span"); c.id="caret"; ansEl.appendChild(c); }
  else ansEl.appendChild(numEl(state.entry, reveal?"reveal tada":null));
}

export function newProblem(){
  state.presentation = pick(["digits","emoji","pips"]);
  do{ state.a=1+rnd(9); state.b=1+rnd(9); }
  while(state.a+state.b>state.sumMax || (state.presentation==="pips" && (state.a>6||state.b>6)));
  state.answer=state.a+state.b; state.entry=""; state.wrongCount=0; render();
}
