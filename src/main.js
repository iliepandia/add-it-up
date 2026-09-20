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
import "./styles/waterBar.css";
import "./styles/presentationPicker.css";

import {
  GOAL, SUM_START, SUM_MIN, SUM_MAX_CAP, SEE_RESULT, STAR_FLY, IMPACT_AT,
  POST_HOLD, WIN_HOLD, WRONG_HOLD,
  REVEAL_FLASH, REVEAL_TO_FLASH, FLASH_REPEATS, KEY_FLASH_ON, KEY_FLASH_GAP, reduceMotion,
  WRONG_FACES, pick, FLYBY_DURATION, REWARD_SHOWER_DURATION, BONUS_REWARD_GLYPH
} from "./config.js";
import {
  card, keypad, flash, win, playBtn, picker, statsLink, statsScreen, prizeBoxLink, prizeBox,
  difficultyToggle, difficultyHint, statsDifficultyToggle, presentationPickerEl, waterCakeEl
} from "./dom.js";
import { audio, sTada, sError, sDing } from "./audio.js";
import { applyTheme, themeState, checkStreak } from "./themes.js";
import { newProblem, renderAns, showOperandHints } from "./problem.js";
import { buildStars, fillStar, refreshStars, prepareBonusStar, revealBonusStar } from "./stars.js";
import { celebrate, tadaSparkles, flyStar, flyCakeTo } from "./fx.js";
import { showWin } from "./win.js";
import { showPicker, wirePicker } from "./picker.js";
import { state, keyByDigit } from "./state.js";
import { initStats, startSession, recordGame, recordMistake, recordLatency, getLatencyStats } from "./stats.js";
import { showStats, wireStats } from "./statsScreen.js";
import { showPrizeBox, wirePrizeBox } from "./prizeBox.js";
import { handlePickerKeydown, wireMasteryBadge, renderMasteryBadge } from "./mastery.js";
import { renderDifficultyToggle, attemptToggleMode, applyModeLook } from "./difficulty.js";
import { getHardDrainDuration, adjustHardDrainDuration } from "./hardDifficulty.js";
import { showWaterBar, hideWaterBar, freezeWaterBar, takeWaterCake, waterHasWater } from "./waterBar.js";
import { showPresentationPicker, resetPresentationRotation } from "./presentationPicker.js";

// ---- input ----
// Typing never auto-submits (fat-finger taps used to instantly count as a
// wrong answer) — the child types up to 2 digits, then confirms with the
// green checkmark or clears with the red X.
function handleDigit(d){
  if(state.locked) return;
  if(state.entry.length>=2) return; // at most 2 digits; extra taps are ignored
  themeState.current.click(); state.entry+=String(d); renderAns();
}
function clearEntry(){
  if(state.locked || state.entry==="") return;
  themeState.current.click(); state.entry=""; renderAns();
}
function submitEntry(){
  if(state.locked || state.entry==="") return;
  const val=parseInt(state.entry,10);
  const isCorrect = val===state.answer;
  if(!state.latencyLogged){
    // Response-time baseline (§17.6 step 1) — silent, first attempt only,
    // never shown to the child, never affects gameplay. maxOperand lets the
    // stats screen separate "this representation is slow" from "big numbers
    // are slow", and isCorrect keeps a fast wrong guess out of the
    // recall-speed numbers entirely (see recordLatency in stats.js).
    const ms = performance.now() - state.problemShownAt;
    recordLatency(state.mode, state.presentation, ms, Math.max(state.a, state.b), isCorrect);
    // Only correct first attempts feed this game's median — that median is
    // what the stats screen's speed trend is built from.
    if(isCorrect && Number.isFinite(ms) && ms >= 0) state.gameLatencies.push(ms);
    state.latencyLogged = true;
  }
  if(isCorrect){
    // Hard mode's water bar: whether it still had water at this exact
    // instant decides the bonus (2nd) star — checked at submit time, then
    // carried through correct()'s SEE_RESULT delay to the star-fill itself.
    state.pendingBonus = state.mode==="hard" && waterHasWater();
    correct();
  }else wrong();
}

// ---- correct ----
function correct(){
  state.locked=true; renderAns(); freezeWaterBar();
  // Association pass: now that the answer is in, show each operand the *other*
  // way (pips under digits, the numeral under pips/emoji) so the shape and the
  // number get tied together while the child is looking at a win. Safe to show
  // the same hint as the second-miss scaffold (§17.2) because it lands *after*
  // the commit with input already locked — it can't help solve anything, so it
  // isn't a shortcut, and it carries no judgement either way (§17.6).
  // Deliberately before the SEE_RESULT beat below, so the layout it adds has
  // settled by the time flyStar() measures where the star should land.
  showOperandHints();
  const bonus = state.pendingBonus; state.pendingBonus=false;
  setTimeout(()=>{
    state.sumMax=Math.min(SUM_MAX_CAP, state.sumMax+1);
    state.streak++; state.maxStreak=Math.max(state.maxStreak, state.streak);
    state.starCount++;
    if(bonus) state.bonusStarCount++;
    const idx=state.starCount-1, won=state.starCount>=GOAL;
    const impactAt=STAR_FLY*IMPACT_AT;
    const BONUS_GAP=250;
    const onImpact=()=>{
      fillStar(idx); refreshStars(); celebrate();
      if(bonus){
        // Speed bonus: the biker beat the bar to the cake, so the cake itself
        // flies up from the bar's start and lands under the star, after the
        // regular star. The streak reward waits for that flight to land too,
        // so a shower or flyby never plays over the cake.
        const b=prepareBonusStar(idx);
        if(reduceMotion){ takeWaterCake(); revealBonusStar(b); checkStreak(); }
        else setTimeout(()=>{
          flyCakeTo(waterCakeEl, b, BONUS_REWARD_GLYPH, ()=>{ revealBonusStar(b); checkStreak(); });
          takeWaterCake(); // it left the bar — rect already captured above
        }, BONUS_GAP);
      }else checkStreak();
    };
    if(won){
      recordGame(state.mode, { wrongCount: state.gameWrongTotal, theme: themeState.name, streak: state.maxStreak, latencies: state.gameLatencies });
      // Between-game adaptivity (not mid-game): a perfect-timing game speeds
      // the bar up next time, a game where it drained more than half the
      // time slows it back down — see hardDifficulty.js.
      if(state.mode==="hard") adjustHardDrainDuration(state.bonusStarCount, GOAL);
    }
    const advance = () => { if(won){ hideWaterBar(); showWin(); } else advanceProblem(); };
    if(reduceMotion){
      onImpact();
      setTimeout(advance, won?WIN_HOLD:POST_HOLD);
    }else{
      flyStar(idx,onImpact);
      // Hard mode's presentation picker is a full-screen overlay, so it must
      // wait for the bonus-star flight and any streak reward to finish.
      const bonusExtra = bonus ? BONUS_GAP + impactAt : 0;
      // With a bonus the reward only starts once the cake lands, so its
      // duration stacks on top of bonusExtra instead of overlapping it.
      const rewardMs = state.mode==="hard" && !won
        ? ([3,9].includes(state.streak) ? REWARD_SHOWER_DURATION : state.streak===6 ? FLYBY_DURATION : 0) : 0;
      const hold = won ? WIN_HOLD : Math.max(POST_HOLD, rewardMs);
      setTimeout(advance, impactAt + bonusExtra + hold);
    }
  }, SEE_RESULT);
}

// ---- wrong ----
function wrong(){
  state.locked=true; renderAns(); sError();
  state.sumMax=Math.max(SUM_MIN, state.sumMax-2); state.streak=0; state.gameWrongTotal++; refreshStars();
  recordMistake(state.mode, state.a, state.b);
  if(!reduceMotion){ card.classList.add("shake"); card.addEventListener("animationend",()=>card.classList.remove("shake"),{once:true}); }
  flash.textContent=pick(WRONG_FACES);
  flash.classList.remove("show"); void flash.offsetWidth; flash.classList.add("show");
  state.wrongCount++;
  // Second miss: help before telling (§17.2). The quantity hint goes up under
  // both operands and stays there through the reveal and the re-ask, so the
  // child can actually work the fact out instead of only being shown it.
  // Never-skip is unchanged — the same problem still comes back.
  if(state.wrongCount>=2){ showOperandHints(); setTimeout(revealAnswer, REVEAL_FLASH); }
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
  startSession(state.mode);
  state.starCount=0; state.sumMax=SUM_START; state.streak=0; state.maxStreak=0; state.gameWrongTotal=0;
  state.bonusStarCount=0; state.pendingBonus=false; state.gameLatencies=[];
  state.objectProblems=0; // the pips/emoji allowance (§4) is per game, like the rotation below
  resetPresentationRotation();
  if(state.mode==="hard") state.waterDrainMs=getHardDrainDuration(getLatencyStats("easy").combined?.max);
  buildStars(); refreshStars(); advanceProblem();
}
// Easy mode goes straight to the next problem; hard mode asks how to see it
// first, every single time (presentationPicker.js), then starts that
// problem's water bar once it's shown.
function advanceProblem(){
  if(state.mode==="hard"){
    hideWaterBar();
    showPresentationPicker(choice=>{
      state.presentation=choice;
      newProblem();
      unlockEnter();
      showWaterBar();
    });
  }else{
    newProblem();
    unlockEnter();
  }
}
function unlockEnter(){
  state.locked=false;
  if(!reduceMotion){ card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter"); }
}

// ---- wiring ----
function wireKey(btn, onTap){
  btn.addEventListener("pointerdown", e=>{ e.preventDefault(); audio(); btn.classList.add("press"); onTap(); });
  const up=()=>{ btn.classList.remove("press"); btn.blur(); };
  btn.addEventListener("pointerup",up); btn.addEventListener("pointerleave",up); btn.addEventListener("pointercancel",up);
}
function buildKeypad(){
  [1,2,3,4,5,6,7,8,9].forEach(d=>{
    const btn=document.createElement("button");
    btn.className="key"; btn.textContent=d; btn.type="button";
    wireKey(btn, ()=>handleDigit(d));
    keyByDigit[String(d)]=btn; keypad.appendChild(btn);
  });

  const clearBtn=document.createElement("button");
  clearBtn.id="clearKey"; clearBtn.className="key key-clear"; clearBtn.type="button"; clearBtn.textContent="✕";
  clearBtn.setAttribute("aria-label","Clear"); clearBtn.disabled=true;
  wireKey(clearBtn, clearEntry);
  keypad.appendChild(clearBtn);

  const zeroBtn=document.createElement("button");
  zeroBtn.className="key zero"; zeroBtn.type="button"; zeroBtn.textContent="0";
  wireKey(zeroBtn, ()=>handleDigit(0));
  keyByDigit["0"]=zeroBtn; keypad.appendChild(zeroBtn);

  const submitBtn=document.createElement("button");
  submitBtn.id="submitKey"; submitBtn.className="key key-submit"; submitBtn.type="button";
  submitBtn.innerHTML='<span class="submit-check">✓</span>';
  submitBtn.setAttribute("aria-label","Submit"); submitBtn.disabled=true;
  wireKey(submitBtn, submitEntry);
  keypad.appendChild(submitBtn);
}
window.addEventListener("keydown",e=>{
  if(statsScreen.classList.contains("show")) return;
  if(prizeBox.classList.contains("show")) return;
  if(presentationPickerEl.classList.contains("show")) return;
  if(picker.classList.contains("show")){
    if(handlePickerKeydown(e)) return;
    const map={"1":"classic","2":"nature","3":"space","4":"animal"};
    if(map[e.key]){ audio(); applyTheme(map[e.key]); themeState.current.click(); startGame(); }
    return;
  }
  // On the win screen only Enter/Space restarts; every other key is swallowed,
  // so a stray press can't cut the trophy/snake celebration short.
  if(win.classList.contains("show")){
    if(e.key==="Enter" || e.key===" "){ audio(); showPicker(); }
    return;
  }
  if(e.key>="0" && e.key<="9"){ audio(); handleDigit(parseInt(e.key,10)); return; }
  if(e.key==="Enter"){ audio(); submitEntry(); return; }
  if(e.key==="Backspace" || e.key==="Escape" || e.key==="Delete"){ audio(); clearEntry(); }
});
// Restart is the Play button alone. Tapping anywhere on the win screen used to
// restart, so a kid reaching for a trophy — or for the snake — cancelled the
// celebration by accident.
playBtn.addEventListener("pointerdown",e=>{ e.preventDefault(); audio(); showPicker(); });
statsLink.addEventListener("pointerdown",e=>{ e.preventDefault(); e.stopPropagation(); audio(); showStats(); });
prizeBoxLink.addEventListener("pointerdown",e=>{ e.preventDefault(); e.stopPropagation(); audio(); showPrizeBox(); });

// ---- difficulty toggle (shared control, picker + stats screen; §difficulty.js) ----
let hintTimer=null;
function showDifficultyHint(){
  if(!difficultyHint) return;
  difficultyHint.hidden=false;
  clearTimeout(hintTimer);
  hintTimer=setTimeout(()=>{ difficultyHint.hidden=true; }, 1800);
}
function refreshDifficultyUI(){
  renderDifficultyToggle(difficultyToggle);
  renderDifficultyToggle(statsDifficultyToggle);
  renderMasteryBadge();
  applyModeLook();
  if(statsScreen.classList.contains("show")) showStats();
}
function wireDifficultyToggle(btn){
  if(!btn) return;
  btn.addEventListener("pointerdown", e=>{
    e.preventDefault(); e.stopPropagation();
    if(attemptToggleMode()){
      audio(); sDing();
      refreshDifficultyUI();
    }else{
      audio(); sError();
      if(btn===difficultyToggle) showDifficultyHint();
      btn.classList.remove("deny"); void btn.offsetWidth; btn.classList.add("deny");
    }
  });
}

// ---- boot ----
buildKeypad();
wirePicker(name=>{ applyTheme(name); themeState.current.click(); startGame(); });
wireStats();
wirePrizeBox();
wireMasteryBadge();
wireDifficultyToggle(difficultyToggle);
wireDifficultyToggle(statsDifficultyToggle);
refreshDifficultyUI();
initStats();
showPicker();
document.querySelector("#buildVer").textContent = `ver: ${__BUILD_VERSION__}`;
