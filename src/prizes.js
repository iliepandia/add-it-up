// Persistent prize collection: one prize is added per finished game, drawn
// from the same WIN_END glyph shown on the trophy screen. Stored entirely in
// localStorage on this device, kept separate from stats.js on purpose so
// "Reset stats" never wipes a child's collected prizes.

const STORAGE_KEY = "addItUpPrizes";

// Reward a high score, not just finishing: a game's icon size depends on its
// score out of 10. Entries saved before this feature existed are plain emoji
// strings with no score attached — those render at the normal 1x size
// (see sizeScaleForScore) rather than being guessed at retroactively.
const SMALL_SCALE = 0.75, NORMAL_SCALE = 1, BIG_SCALE = 1.25, PERFECT_SCALE = 1.5;

function sizeScaleForScore(score){
  if(score == null) return NORMAL_SCALE;
  if(score >= 10) return PERFECT_SCALE;
  if(score <= 3) return SMALL_SCALE;
  if(score >= 8) return BIG_SCALE;
  return NORMAL_SCALE;
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  }catch(e){ return []; }
}

function save(list){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }catch(e){ /* storage unavailable (private mode, quota) — prizes just won't persist */ }
}

export function addPrize(emoji, score, mode){
  const list = load();
  list.push({ emoji, score, mode });
  save(list);
}

// Flat list of prize tiles to render, in the order they were earned (storage
// is already append-only chronological, so this is just a straight map).
// Each tile carries its own display scale, derived from that game's score.
// Both modes share this one box (per design) — `mode` just lets the box
// badge a hard-mode tile differently; entries earned before hard mode
// existed have no mode recorded and are treated as easy.
//
// `index` is the tile's position in storage. The merge game (prizeMerge.js)
// needs it to trade four specific entries for one, and it is only valid for
// as long as the render it came from is on screen — any write shifts every
// later index, which is why a merge re-renders the whole shelf.
export function getPrizeTiles(){
  const list = load();
  return list.map((entry, index) => {
    // Old storage format was a plain emoji string, with no score recorded.
    const emoji = typeof entry === "string" ? entry : entry.emoji;
    const score = typeof entry === "string" ? null : entry.score;
    const mode = typeof entry === "string" ? "easy" : (entry.mode || "easy");
    // A merged prize was never played for, so it has no score to derive a
    // size from — it carries the size inherited from the four it replaced.
    const scale = entry && entry.scale != null ? entry.scale : sizeScaleForScore(score);
    const perfect = entry && entry.perfect != null ? !!entry.perfect : score === 10;
    return { emoji, scale, perfect, hard: mode === "hard", index };
  });
}

// The four-of-a-kind trade (see prizeMerge.js): the entries at `indices` are
// deleted and one new prize takes the slot `keepIndex` held, so the reward
// appears exactly where the last tapped prize was. Net effect on the
// collection is -3 entries. Called only when the present is actually opened —
// a present left unopened costs the child nothing.
// `mode` is the mode of the four that were spent, so a Fast merge stays a Fast
// prize: it keeps the 🚴 badge, its own tap sound and its eruption.
// Returns the new prize's index in the rewritten list.
export function mergePrizes(indices, keepIndex, emoji, scale, perfect, mode){
  const list = load();
  const drop = new Set(indices);
  const merged = { emoji, scale, perfect, mode: mode || "easy", merged: true };
  const next = [];
  let newIndex = -1;
  list.forEach((entry, i) => {
    if(i === keepIndex){ newIndex = next.length; next.push(merged); }
    else if(!drop.has(i)) next.push(entry);
  });
  // keepIndex fell off the end (storage changed underneath us) — still grant
  // the prize rather than silently swallowing four tiles.
  if(newIndex < 0){ newIndex = next.length; next.push(merged); }
  save(next);
  return newIndex;
}
