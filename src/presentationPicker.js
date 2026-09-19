// Hard mode asks how to see each problem before generating it — unlike easy
// mode's random-per-problem pick (problem.js), the child chooses PIPS,
// DIGITS or Emoji fresh before every single problem by tapping its "?".
// The previews shown (5 pips, the digit 9, one apple) are fixed samples of
// each representation, not the upcoming problem's actual numbers.

import { presentationPickerEl } from "./dom.js";
import { PIPS } from "./config.js";
import { audio } from "./audio.js";

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

let activeChoose = null;

function handlePick(key){
  const done = activeChoose;
  if(!done) return;
  activeChoose = null;
  presentationPickerEl.classList.remove("show");
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
  OPTIONS.forEach(({ key, build }) => {
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
