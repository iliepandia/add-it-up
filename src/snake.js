// Retro crawling snake shown on the end screen after a perfect game (no
// mistakes). Purely decorative — sits behind every other win-screen element
// (see #snakeLayer's z-index:-1 in styles/snake.css) and never intercepts
// taps. Moves on a fixed grid, one cell per tick, always turning before it
// would run off-screen or into its own body. After a while it shrinks away
// tail-first and vanishes, rather than crawling forever.

import { snakeLayer } from "./dom.js";
import { reduceMotion } from "./config.js";

const CELL = 26;      // px per grid cell
const LENGTH = 8;      // body blocks, including the head, before it starts shrinking
const TICK_MS = 150;   // ms per grid step
const TURN_CHANCE = 0.35; // odds of an unforced sharp turn on any given tick
const HARD_LENGTH_MULT = 2, HARD_LIFE_MULT = 2; // hard variant: twice as long, lives twice as long
const SHRINK_AFTER_MS = 20000; // how long the snake crawls at full length first
const SHRINK_STEP_MS = 400;    // how long each tail segment takes to disappear once shrinking starts
const EAT_STEP_MS = 90;   // stagger between each segment's pop starting, head to tail
// A segment snaps to full size instantly — a swallow should look like a sudden
// bulge, not a swell — and then eases back down over EAT_RETURN_MS. Only the
// return is animated, and this is the single knob for how slow it is:
// buildSegs() pushes it into CSS, so the keyframes and the JS timing that waits
// on them can't drift apart.
const EAT_RETURN_MS = 500;

const DIRS = [[1,0], [-1,0], [0,1], [0,-1]];

let timer = null;
let segEls = [];   // outer shells — carry grid position (translate) only
let segFaces = [];   // inner faces — carry the eat-pop scale animation, so it never fights position
let cols = 0, rows = 0;
let head = { x: 0, y: 0 };
let dir = DIRS[0];
let body = []; // positions, index 0 = head
let startedAt = 0;
let maxLen = LENGTH, shrinkAfter = SHRINK_AFTER_MS; // per-variant
let capLength = LENGTH; // current max length; counts down once shrinking begins
let onStep = null; // optional callback(segmentRects) fired after every tick
let eating = false; // true while an eat animation is playing — pauses movement/onStep

function inBounds(x, y){ return x >= 0 && x < cols && y >= 0 && y < rows; }
function sameDir(a, b){ return a[0] === b[0] && a[1] === b[1]; }
function opposite(d){ return [-d[0], -d[1]]; }

// The current tail cell vacates on this same step (once the snake has
// reached its cap length, every step pops it) — so it's never an obstacle.
function isBodyCell(x, y){
  const blocked = body.length >= capLength ? body.slice(0, -1) : body;
  return blocked.some(p => p.x === x && p.y === y);
}
function safeCell(x, y){ return inBounds(x, y) && !isBodyCell(x, y); }

function nextDirection(){
  const straightOk = safeCell(head.x + dir[0], head.y + dir[1]);
  const turnCandidates = DIRS.filter(d =>
    !sameDir(d, dir) && !sameDir(d, opposite(dir)) && safeCell(head.x + d[0], head.y + d[1])
  );
  if(!straightOk && turnCandidates.length) return turnCandidates[Math.floor(Math.random() * turnCandidates.length)];
  if(straightOk && turnCandidates.length && Math.random() < TURN_CHANCE) return turnCandidates[Math.floor(Math.random() * turnCandidates.length)];
  if(straightOk) return dir;
  return opposite(dir); // walled in by bounds/itself on every side — last resort
}

function layout(){
  cols = Math.max(4, Math.floor(innerWidth / CELL));
  rows = Math.max(4, Math.floor(innerHeight / CELL));
}

function buildSegs(){
  snakeLayer.innerHTML = "";
  snakeLayer.style.setProperty("--eat-return", EAT_RETURN_MS + "ms");
  segEls = []; segFaces = [];
  for(let i = 0; i < maxLen; i++){
    const s = document.createElement("div");
    s.className = "snake-seg" + (i === 0 ? " snake-head" : "");
    // Segments are built head-first, so without this the tail would paint over
    // the head — the snake would look like it was crawling under itself, and
    // an eating head would be hidden behind the segment right behind it.
    // Descending z-index puts the head on top and each segment above the one
    // behind it. Contained by #snakeLayer's own stacking context, so none of
    // this can rise above the win screen's content.
    s.style.zIndex = String(maxLen - i);
    const face = document.createElement("div");
    face.className = "snake-seg-face";
    if(i === 0){
      const mouth = document.createElement("div");
      mouth.className = "snake-mouth";
      face.appendChild(mouth);
    }
    s.appendChild(face);
    snakeLayer.appendChild(s);
    segEls.push(s); segFaces.push(face);
  }
}

function place(){
  segEls.forEach((el, i) => {
    const p = body[i] || body[body.length - 1];
    el.style.transform = `translate(${p.x * CELL}px, ${p.y * CELL}px)`;
  });
}

function tick(){
  if(eating) return; // paused mid "eat" animation — see eatPrize()

  dir = nextDirection();
  head = { x: head.x + dir[0], y: head.y + dir[1] };
  body.unshift(head);

  const shrinkFor = performance.now() - startedAt - shrinkAfter;
  capLength = shrinkFor > 0 ? Math.max(0, maxLen - 1 - Math.floor(shrinkFor / SHRINK_STEP_MS)) : maxLen;

  while(segEls.length > capLength){ const seg = segEls.pop(); segFaces.pop(); if(seg) seg.remove(); }
  if(capLength <= 0){ stopSnake(); return; }
  if(body.length > capLength) body.length = capLength; // drop the oldest (tail) cells

  place();
  if(onStep) onStep(body.map(p => ({ x: p.x * CELL, y: p.y * CELL, w: CELL, h: CELL })));
}

/** Plays a bulge that pops the head bigger, then travels tail-ward through
 *  the body — the visual of swallowing one prize. Each segment snaps to full
 *  size at once, then deflates over EAT_RETURN_MS. Pauses movement (and stops
 *  new touches from being detected) until the last segment has finished
 *  deflating, then calls onDone so a caller can either resume play or
 *  immediately queue the next eat. */
export function eatPrize(onDone){
  eating = true;
  if(!segFaces.length){ eating = false; if(onDone) onDone(); return; }
  let i = 0;
  (function step(){
    const face = segFaces[i];
    if(face){
      face.classList.remove("snake-eating"); void face.offsetWidth; // restart cleanly if still mid-pop
      face.classList.add("snake-eating");
      face.addEventListener("animationend", () => face.classList.remove("snake-eating"), { once: true });
    }
    i++;
    if(i < segFaces.length) setTimeout(step, EAT_STEP_MS);
    else setTimeout(() => { eating = false; if(onDone) onDone(); }, EAT_RETURN_MS);
  })();
}

/** onStepCb(segmentRects), if given, fires after every tick with each
 *  current body segment's viewport-pixel rect ({x,y,w,h}) — lets a caller
 *  (e.g. the win screen) react to the snake touching something on screen.
 *  variant "hard" recolors the snake bright red (see snake.css); anything
 *  else (including omitted) keeps the classic green. */
export function startSnake(onStepCb, variant){
  stopSnake();
  if(reduceMotion || !snakeLayer) return;
  layout();
  head = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
  dir = DIRS[Math.floor(Math.random() * DIRS.length)];
  body = [head];
  const hard = variant === "hard";
  maxLen = hard ? LENGTH * HARD_LENGTH_MULT : LENGTH;
  shrinkAfter = hard ? SHRINK_AFTER_MS * HARD_LIFE_MULT : SHRINK_AFTER_MS;
  capLength = maxLen;
  startedAt = performance.now();
  onStep = onStepCb || null;
  snakeLayer.classList.toggle("snake-hard", variant === "hard");
  buildSegs();
  place();
  timer = setInterval(tick, TICK_MS);
}

export function stopSnake(){
  if(timer){ clearInterval(timer); timer = null; }
  if(snakeLayer){ snakeLayer.innerHTML = ""; snakeLayer.classList.remove("snake-hard"); }
  segEls = []; segFaces = [];
  onStep = null;
  eating = false;
}
