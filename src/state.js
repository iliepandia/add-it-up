// Shared mutable game state. Plain object on purpose: this is a small game,
// not worth a store/class layer on top of it.

import { SUM_START } from "./config.js";

export const state = {
  a: 0, b: 0, answer: 0,
  presentation: "digits", pipStyle: "dice", entry: "",
  starCount: 0, wrongCount: 0, locked: true,
  sumMax: SUM_START, streak: 0, maxStreak: 0,
  gameWrongTotal: 0 // mistakes across the whole game, for the stats score (10 - mistakes, floor 0)
};

export const keyByDigit = {};
