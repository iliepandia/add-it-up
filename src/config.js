// Tunable constants for the game loop, timing, and content banks.

export const GOAL = 10;
export const SUM_START = 5, SUM_MIN = 5, SUM_MAX_CAP = 12; // difficulty ramp: start, floor, ceiling
export const SEE_RESULT = 200;
export const STAR_FLY = 1050, IMPACT_AT = 0.82;
export const POST_HOLD = 1200, WIN_HOLD = 1400, WRONG_HOLD = 1000;
export const REVEAL_FLASH = 700, REVEAL_TO_FLASH = 500, FLASH_REPEATS = 2;
export const KEY_FLASH_ON = 550, KEY_FLASH_GAP = 250;

export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const EMOJI = {
  animals: ["🐶","🐱","🐰","🐼","🐸","🐷","🐵","🐨","🦁","🐯","🐮","🐔","🐴","🐹"],
  fruit: ["🍎","🍌","🍓","🍇","🍊","🍉","🍑","🍍","🥝","🍒","🥭","🍐"],
  nature: ["🌸","🌻","🌼","🌈","🌟","🍀","🌿","🌴","🌷","🍁","🌵","🌺"],
  birds: ["🐦","🐤","🦜","🦉","🦆","🦅","🐧","🦩","🐓"],
  household: ["🏠","🪑","🧸","🎈","🎀","🔔","🧺","🎁","🪀","⏰"],
  space: ["🚀","🛸","🪐","🌙","⭐","🌟","✨","☄️","🌌","👽","🛰️","🌠"]
};
export const CATS = Object.keys(EMOJI);
export const HAPPY = ["❤️","🎁","😄","⭐","🎉","🌈","🥳","🌟","💖","🎈","🦄","🍭","😍","🎊"];
export const WRONG_FACES = ["🤔","❓"];
export const WIN_END = ["🐄","🚀","🦖","🚲","🚗","🎂",
  "🌈","🌞","🌻","🌸","🌳","🍄","🦋","🐢","🐝","🐬",
  "🎈","🎁","🧸","🎉","🪁","🚂","⚽","🏰","🎨","🍦"];
export const PIPS = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};

export const rnd = n => Math.floor(Math.random()*n);
export const pick = arr => arr[rnd(arr.length)];
