// Hard mode asks how to see each problem before generating it — unlike easy
// mode's random-per-problem pick (problem.js), the child chooses PIPS,
// DIGITS or Emoji fresh before every single problem by tapping its "?".
// The previews shown (5 pips, the digit 9, one apple) are fixed samples of
// each representation, not the upcoming problem's actual numbers.

import { presentationPickerEl } from "./dom.js";
import { PIPS } from "./config.js";
import { audio } from "./audio.js";
import { objectQuotaLeft } from "./problem.js";

const OPTIONS = [
  { key: "pips", build: pipsPreview },
  { key: "digits", build: digitsPreview },
  { key: "emoji", build: emojiPreview }
];

function pipsPreview(){
  const card = document.createElement("div");
  card.className = "pip-card dice pres-pip-card";
  const on = new Set(PIPS[5]);
  for(let i = 0; i < 9; i++){
    const d = document.createElement("div");
    d.className = "pip " + (on.has(i) ? "on" : "off");
    card.appendChild(d);
  }
  return card;
}
function digitsPreview(){
  const s = document.createElement("div");
  s.className = "pres-digit-preview";
  s.textContent = "9";
  return s;
}
function emojiPreview(){
  const s = document.createElement("div");
  s.className = "pres-emoji-preview";
  s.textContent = "🍎";
  return s;
}

// Keep the practice varied: pick the same representation RUN_LIMIT times in
// a row and it drops out of the list for the next LOCKOUT_TURNS problems.
const RUN_LIMIT = 5, LOCKOUT_TURNS = 5;
let lastKey = null, runLength = 0;
let lockedKey = null, lockedTurns = 0;

export function resetPresentationRotation(){
  lastKey = null; runLength = 0; lockedKey = null; lockedTurns = 0;
}

function trackRotation(key){
  if(lockedTurns > 0) lockedTurns--; // this turn served part of the sit-out
  if(key === lastKey) runLength++; else { lastKey = key; runLength = 1; }
  if(runLength >= RUN_LIMIT){ lockedKey = key; lockedTurns = LOCKOUT_TURNS; lastKey = null; runLength = 0; }
}

let activeChoose = null;

function handlePick(key){
  const done = activeChoose;
  if(!done) return;
  activeChoose = null;
  presentationPickerEl.classList.remove("show");
  trackRotation(key);
  done(key);
}

export function showPresentationPicker(onChoose){
  activeChoose = onChoose;
  presentationPickerEl.innerHTML = "";
  const h = document.createElement("h1");
  h.textContent = "Pick how to see it!";
  presentationPickerEl.appendChild(h);

  const row = document.createElement("div");
  row.className = "pres-options";
  // Two independent narrowings, applied in order of authority. The game's
  // object-presentation allowance (§4) is a hard rule and comes first; the
  // anti-rut lockout is only a nudge, so it's skipped whenever applying it
  // would leave nothing to pick — otherwise a spent allowance plus a locked-out
  // Digits would offer an empty row and the game would stall here.
  const allowed = OPTIONS.filter(o => o.key === "digits" || objectQuotaLeft());
  const offered = allowed.length > 1
    ? allowed.filter(o => !(lockedTurns > 0 && o.key === lockedKey))
    : allowed;
  offered.forEach(({ key, build }) => {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "pres-option"; btn.dataset.presentation = key;
    btn.appendChild(build());
    const q = document.createElement("span");
    q.className = "pres-q"; q.textContent = "?";
    btn.appendChild(q);
    btn.addEventListener("pointerdown", e => { e.preventDefault(); audio(); handlePick(key); });
    row.appendChild(btn);
  });
  presentationPickerEl.appendChild(row);
  presentationPickerEl.classList.add("show");
}
