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
// ---- the swallow (see eatPrize) ----
// The bulge is a travelling WAVE, not a per-block pop: a lump moves from head
// to tail and the blocks around it swell too, on a sliding scale, so a bulge in
// the middle of the snake visibly pushes out its neighbours on both sides.
// That coupling is why this is driven frame by frame in JS — a CSS animation
// can only ever describe one element in isolation.
//
// A block's own rise takes EAT_RISE_MS (it starts swelling once the wave is
// EAT_SPREAD blocks away and peaks as the wave arrives) and its settle takes
// EAT_RETURN_MS. Those two times set everything else: the wave crosses one
// block every EAT_RISE_MS / EAT_SPREAD, and its trailing edge stretches over
// however many blocks EAT_RETURN_MS buys at that speed. Make the settle longer
// than the rise and the lump just grows a longer tail behind it.
const EAT_SPREAD = 3;       // blocks ahead of the wave that have already started to swell
const EAT_RISE_MS = 500;    // normal size -> full, for any one block
const EAT_RETURN_MS = 500;  // full -> normal
const EAT_STEP_MS = EAT_RISE_MS / EAT_SPREAD;        // ms for the wave to cross one block
const EAT_FALL_BLOCKS = EAT_RETURN_MS / EAT_STEP_MS; // how far the settling tail reaches
const HEAD_PEAK = 4.28, BODY_PEAK = 3.49;            // full-size multipliers; the head bulges more

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
let mouthEl = null; // the head's "O" mouth, opened in step with the head's own swell

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
  segEls = []; segFaces = []; mouthEl = null;
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
      mouthEl = document.createElement("div");
      mouthEl.className = "snake-mouth";
      face.appendChild(mouthEl);
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

// Smoothstep — eases both ends of a block's swell so the wave reads as a soft
// lump travelling under the skin rather than a row of triangles.
const smooth = w => w * w * (3 - 2 * w);

/** How swollen the block `dist` blocks from the wave centre should be, 0..1.
 *  Positive `dist` is ahead of the wave (still rising), negative is behind it
 *  (settling back), which is what lets the two sides have different lengths. */
function bulgeAt(dist){
  const reach = dist >= 0 ? EAT_SPREAD : EAT_FALL_BLOCKS;
  if(reach <= 0) return dist === 0 ? 1 : 0;
  return smooth(Math.max(0, Math.min(1, 1 - Math.abs(dist) / reach)));
}

/** The visual of swallowing one prize: a lump that swells the head and travels
 *  tail-ward, carrying its neighbours with it (see the constants above).
 *  Pauses movement — and new-touch detection — until the wave has left the
 *  tail and every block is back to normal, then calls onDone so a caller can
 *  resume play or queue the next eat. */
export function eatPrize(onDone){
  eating = true;
  const faces = segFaces, n = faces.length;
  if(!n){ eating = false; if(onDone) onDone(); return; }
  const finish = () => { eating = false; if(onDone) onDone(); };

  // The centre starts far enough ahead of the head that the head begins at
  // normal size, and runs past the tail far enough for the last block to
  // finish settling.
  const from = -EAT_SPREAD, to = (n - 1) + EAT_FALL_BLOCKS;
  const durationMs = (to - from) * EAT_STEP_MS;
  const t0 = performance.now();

  (function frame(now){
    // Bail out if the snake was torn down (or restarted) mid-swallow.
    if(!eating || segFaces !== faces){ return; }
    const t = Math.min(durationMs, now - t0);
    const centre = from + t / EAT_STEP_MS;
    for(let i = 0; i < n; i++){
      const w = bulgeAt(i - centre);
      const peak = (i === 0 ? HEAD_PEAK : BODY_PEAK) - 1;
      faces[i].style.transform = `scale(${(1 + peak * w).toFixed(3)})`;
    }
    // The mouth opens exactly in step with the head's own swell.
    if(mouthEl){
      const w = bulgeAt(0 - centre);
      mouthEl.style.transform = `translate(-50%,-50%) scale(${w.toFixed(3)})`;
      mouthEl.style.opacity = w.toFixed(3);
    }
    if(t < durationMs) requestAnimationFrame(frame);
    else { clearBulge(faces); finish(); }
  })(t0);
}

function clearBulge(faces){
  for(const f of faces) f.style.transform = "";
  if(mouthEl){ mouthEl.style.transform = ""; mouthEl.style.opacity = ""; }
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
