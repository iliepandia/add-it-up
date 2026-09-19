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
export function getPrizeTiles(){
  const list = load();
  return list.map(entry => {
    // Old storage format was a plain emoji string, with no score recorded.
    const emoji = typeof entry === "string" ? entry : entry.emoji;
    const score = typeof entry === "string" ? null : entry.score;
    const mode = typeof entry === "string" ? "easy" : (entry.mode || "easy");
    return { emoji, scale: sizeScaleForScore(score), perfect: score === 10, hard: mode === "hard" };
  });
}
