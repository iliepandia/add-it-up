// Shared mutable game state. Plain object on purpose: this is a small game,
// not worth a store/class layer on top of it.

import { SUM_START } from "./config.js";

export const state = {
  a: 0, b: 0, answer: 0,
  presentation: "digits", pipStyle: "dice", entry: "",
  starCount: 0, wrongCount: 0, locked: true,
  sumMax: SUM_START, streak: 0, maxStreak: 0,
  gameWrongTotal: 0, // mistakes across the whole game, for the stats score (10 - mistakes, floor 0)
  problemShownAt: 0, // performance.now() when this problem first became answerable — response-time baseline (§17.6)
  latencyLogged: false, // true once this problem's first-attempt latency has been recorded, so retries don't log again
  gameLatencies: [], // this game's correct first-attempt times (ms); its median is stored per game so speed can be trended
  objectProblems: 0, // problems this game shown as pips/emoji; once it hits MAX_OBJECT_PROBLEMS the rest are digits

  mode: "easy", // "easy" | "hard" — the difficulty toggle; shared by the picker and stats screens
  waterDrainMs: 0, // hard mode only: how long this game's water bar takes to fully drain (constant for the whole game)
  bonusStarCount: 0, // hard mode only: correct answers this game beaten before the bar drained
  pendingBonus: false // hard mode only: set at submit time, consumed by correct()'s delayed star-fill
};

export const keyByDigit = {};
