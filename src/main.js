import "./styles/base.css";
import "./styles/theme-vars.css";
import "./styles/bg.css";
import "./styles/stars.css";
import "./styles/stage.css";
import "./styles/fx.css";
import "./styles/win.css";
import "./styles/picker.css";
import "./styles/animations.css";
import "./styles/stats.css";
import "./styles/rotate.css";
import "./styles/prizeBox.css";
import "./styles/snake.css";
import "./styles/mastery.css";

import {
  GOAL, SUM_START, SUM_MIN, SUM_MAX_CAP, SEE_RESULT, STAR_FLY, IMPACT_AT,
  POST_HOLD, WIN_HOLD, WRONG_HOLD,
  REVEAL_FLASH, REVEAL_TO_FLASH, FLASH_REPEATS, KEY_FLASH_ON, KEY_FLASH_GAP, reduceMotion,
  WRONG_FACES, pick
} from "./config.js";
import { card, keypad, flash, win, picker, statsLink, statsScreen, prizeBoxLink, prizeBox } from "./dom.js";
import { audio, sTada, sError } from "./audio.js";
import { applyTheme, themeState, checkStreak } from "./themes.js";
import { newProblem, renderAns } from "./problem.js";
import { buildStars, fillStar, refreshStars } from "./stars.js";
import { celebrate, tadaSparkles, flyStar } from "./fx.js";
import { showWin } from "./win.js";
import { showPicker, wirePicker } from "./picker.js";
import { state, keyByDigit } from "./state.js";
import { initStats, startSession, recordGame, recordMistake } from "./stats.js";
import { showStats, wireStats } from "./statsScreen.js";
import { showPrizeBox, wirePrizeBox } from "./prizeBox.js";
import { handlePickerKeydown } from "./mastery.js";

// ---- input ----
function handleDigit(d){
  if(state.locked) return;
  themeState.current.click(); state.entry+=String(d); renderAns();
  const val=parseInt(state.entry,10);
  if(val===state.answer) correct();
  else if(state.entry==="1" && state.answer>=10){ /* teen: wait for 2nd digit */ }
  else wrong();
}

// ---- correct ----
function correct(){
  state.locked=true;
  setTimeout(()=>{
    state.sumMax=Math.min(SUM_MAX_CAP, state.sumMax+1);
    state.streak++; state.maxStreak=Math.max(state.maxStreak, state.streak);
    state.starCount++;
    const idx=state.starCount-1, won=state.starCount>=GOAL;
    const onImpact=()=>{ fillStar(idx); refreshStars(); celebrate(); checkStreak(); };
    if(won) recordGame({ wrongCount: state.gameWrongTotal, theme: themeState.name, streak: state.maxStreak });
    if(reduceMotion){
      onImpact();
      setTimeout(()=> won?showWin():(newProblem(),unlockEnter()), won?WIN_HOLD:POST_HOLD);
    }else{
      flyStar(idx,onImpact);
      const afterImpact=STAR_FLY*IMPACT_AT;
      setTimeout(()=> won?showWin():(newProblem(),unlockEnter()), afterImpact + (won?WIN_HOLD:POST_HOLD));
    }
  }, SEE_RESULT);
}

// ---- wrong ----
function wrong(){
  state.locked=true; sError();
  state.sumMax=Math.max(SUM_MIN, state.sumMax-2); state.streak=0; state.gameWrongTotal++; refreshStars();
  recordMistake(state.a, state.b);
  if(!reduceMotion){ card.classList.add("shake"); card.addEventListener("animationend",()=>card.classList.remove("shake"),{once:true}); }
  flash.textContent=pick(WRONG_FACES);
  flash.classList.remove("show"); void flash.offsetWidth; flash.classList.add("show");
  state.wrongCount++;
  if(state.wrongCount>=2) setTimeout(revealAnswer, REVEAL_FLASH);
  else setTimeout(()=>{ state.entry=""; renderAns(); state.locked=false; }, WRONG_HOLD);
}
function revealAnswer(){
  state.entry=String(state.answer); renderAns(true); sTada(); tadaSparkles();
  setTimeout(()=>flashKeys(String(state.answer), FLASH_REPEATS, reAskSame), REVEAL_TO_FLASH);
}
function flashKeys(digits, repeats, done){
  const seq=[]; for(let r=0;r<repeats;r++) for(const d of digits) seq.push(d);
  let i=0;
  (function step(){
    if(i>=seq.length){ setTimeout(done, 300); return; }
    pulseKey(seq[i++]); setTimeout(step, KEY_FLASH_ON+KEY_FLASH_GAP);
  })();
}
function pulseKey(d){
  const btn=keyByDigit[d]; if(!btn) return;
  btn.classList.remove("hint"); void btn.offsetWidth; btn.classList.add("hint");
  themeState.current.click(); setTimeout(()=>btn.classList.remove("hint"), KEY_FLASH_ON);
}
function reAskSame(){ state.entry=""; state.wrongCount=0; renderAns(); state.locked=false; }

// ---- start / restart ----
function startGame(){
  picker.classList.remove("show"); win.classList.remove("show");
  startSession();
  state.starCount=0; state.sumMax=SUM_START; state.streak=0; state.maxStreak=0; state.gameWrongTotal=0;
  buildStars(); refreshStars(); newProblem(); unlockEnter();
}
function unlockEnter(){
  state.locked=false;
  if(!reduceMotion){ card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter"); }
}

// ---- wiring ----
function buildKeypad(){
  [1,2,3,4,5,6,7,8,9,0].forEach(d=>{
    const btn=document.createElement("button");
    btn.className="key"+(d===0?" zero":""); btn.textContent=d; btn.type="button";
    btn.addEventListener("pointerdown",e=>{ e.preventDefault(); audio(); btn.classList.add("press"); handleDigit(d); });
    const up=()=>{ btn.classList.remove("press"); btn.blur(); };
    btn.addEventListener("pointerup",up); btn.addEventListener("pointerleave",up); btn.addEventListener("pointercancel",up);
    keyByDigit[String(d)]=btn; keypad.appendChild(btn);
  });
}
window.addEventListener("keydown",e=>{
  if(statsScreen.classList.contains("show")) return;
  if(prizeBox.classList.contains("show")) return;
  if(picker.classList.contains("show")){
    if(handlePickerKeydown(e)) return;
    const map={"1":"classic","2":"nature","3":"space","4":"animal"};
    if(map[e.key]){ audio(); applyTheme(map[e.key]); themeState.current.click(); startGame(); }
    return;
  }
  if(win.classList.contains("show")){ audio(); showPicker(); return; }
  if(e.key>="0" && e.key<="9"){ audio(); handleDigit(parseInt(e.key,10)); }
});
win.addEventListener("pointerdown",e=>{ e.preventDefault(); audio(); showPicker(); });
statsLink.addEventListener("pointerdown",e=>{ e.preventDefault(); e.stopPropagation(); audio(); showStats(); });
prizeBoxLink.addEventListener("pointerdown",e=>{ e.preventDefault(); e.stopPropagation(); audio(); showPrizeBox(); });

// ---- boot ----
buildKeypad();
wirePicker(name=>{ applyTheme(name); themeState.current.click(); startGame(); });
wireStats();
wirePrizeBox();
initStats();
showPicker();
document.querySelector("#buildVer").textContent = `ver: ${__BUILD_VERSION__}`;
