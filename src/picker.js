// The "pick a world" screen — doubles as the game's intro/start screen.

import { win, picker } from "./dom.js";
import { audio } from "./audio.js";
import { state } from "./state.js";
import { endSession } from "./stats.js";
import { stopSnake } from "./snake.js";

export function showPicker(){
  win.classList.remove("show");
  picker.classList.add("show");
  state.locked=true;
  endSession(); // browsing the picker (or stats, reached from here) is never play time
  stopSnake();
}

/** onPick(themeName) is invoked when the player taps/presses a world. */
export function wirePicker(onPick){
  picker.querySelectorAll("[data-theme]").forEach(btn=>{
    btn.addEventListener("pointerdown",e=>{ e.preventDefault(); audio(); onPick(btn.dataset.theme); });
  });
}
