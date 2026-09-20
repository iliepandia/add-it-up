// Problem generation and rendering (digits / emoji groups / dice-domino pips).

import { rnd, pick, EMOJI, PIPS, HARD_SUM_MIN, SUM_MAX_CAP } from "./config.js";
import { opA, opB, ansEl } from "./dom.js";
import { state } from "./state.js";
import { themeState } from "./themes.js";

// Presentations that show quantity as objects rather than a numeral are capped
// at SUBITIZE_CAP per operand: six is the top of the range a person reads at a
// glance, and past it the pile gets *counted* one item at a time — which trains
// exactly the habit this game is trying to replace (spec §17.5/§17.6 step 5).
// Digits are uncapped; there is nothing to count in a "9".
const SUBITIZE_CAP = 6;
const COUNTABLE_CAPPED = new Set(["pips", "emoji"]);

function pipCard(v){
  const el=document.createElement("div"); el.className="pip-card "+state.pipStyle;
  const on=new Set(PIPS[v]);
  for(let i=0;i<9;i++){ const d=document.createElement("div"); d.className="pip "+(on.has(i)?"on":"off"); el.appendChild(d); }
  return el;
}
function emojiGroup(v,glyph){
  const g=document.createElement("div"); g.className="emoji-group";
  // Cap at 2 rows regardless of screen width, so a larger operand (up to
  // SUBITIZE_CAP) never wraps onto enough lines to push the keypad off-screen.
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

// A "tada" overshoot pop, played once whenever a key flips from dimmed to active.
function popKey(el){
  el.classList.remove("key-pop"); void el.offsetWidth; // restart cleanly if it's already mid-pop
  el.classList.add("key-pop");
  el.addEventListener("animationend", () => el.classList.remove("key-pop"), { once: true });
}

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
  // The clear (✕) and submit (✓) keys are built dynamically in main.js, so
  // they aren't in dom.js's static cache — looked up by id here, the one
  // place their dim state is decided. Both dim when there's nothing to act
  // on: nothing typed yet, or the answer is already committed and input is
  // frozen until the next problem.
  const empty = state.entry==="" || state.locked;
  const submitKey = document.getElementById("submitKey");
  if(submitKey){ const becameActive = submitKey.disabled && !empty; submitKey.disabled = empty; if(becameActive) popKey(submitKey); }
  const clearKey = document.getElementById("clearKey");
  if(clearKey){ const becameActive = clearKey.disabled && !empty; clearKey.disabled = empty; if(becameActive) popKey(clearKey); }
}

// Easy mode picks a random presentation and rides the sum ramp (§3); hard
// mode's presentation is chosen by the child beforehand (presentationPicker.js,
// already stored in state.presentation by the time this runs) and has no
// ramp — just a flat floor so the sum is never below HARD_SUM_MIN.
export function newProblem(){
  const hard = state.mode === "hard";
  if(!hard) state.presentation = pick(["digits","emoji","pips"]);
  do{ state.a=1+rnd(9); state.b=1+rnd(9); }
  while(
    (hard ? (state.a+state.b<HARD_SUM_MIN || state.a+state.b>SUM_MAX_CAP) : state.a+state.b>state.sumMax) ||
    (COUNTABLE_CAPPED.has(state.presentation) && (state.a>SUBITIZE_CAP||state.b>SUBITIZE_CAP))
  );
  state.answer=state.a+state.b; state.entry=""; state.wrongCount=0;
  state.problemShownAt=performance.now(); state.latencyLogged=false; // response-time baseline (§17.6) — first attempt only, retries don't re-log
  render();
}
