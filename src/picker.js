// The "pick a world" screen — doubles as the game's intro/start screen.

import { win, picker } from "./dom.js";
import { audio } from "./audio.js";
import { state } from "./state.js";

export function showPicker(){
  win.classList.remove("show");
  picker.classList.add("show");
  state.locked=true;
}

/** onPick(themeName) is invoked when the player taps/presses a world. */
export function wirePicker(onPick){
  picker.querySelectorAll("[data-theme]").forEach(btn=>{
    btn.addEventListener("pointerdown",e=>{ e.preventDefault(); audio(); onPick(btn.dataset.theme); });
  });
}
