// Persistent prize collection: one prize is added per finished game, drawn
// from the same WIN_END glyph shown on the trophy screen. Stored entirely in
// localStorage on this device, kept separate from stats.js on purpose so
// "Reset stats" never wipes a child's collected prizes.

const STORAGE_KEY = "addItUpPrizes";

// Reward a high score, not just finishing: a game's icon size depends on its
// score out of 10. Entries saved before this feature existed are plain emoji
// strings with no score attached — those render at the normal 1x size
// (see sizeScaleForScore) rather than being guessed at retroactively.
const SMALL_SCALE = 0.75, NORMAL_SCALE = 1, BIG_SCALE = 1.25;

function sizeScaleForScore(score){
  if(score == null) return NORMAL_SCALE;
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

export function addPrize(emoji, score){
  const list = load();
  list.push({ emoji, score });
  save(list);
}

// Flat list of prize tiles to render, same-emoji prizes clustered together
// (in the order each type was first won) so wins collected in random order
// still group on screen instead of scattering by win date. Each tile carries
// its own display scale, derived from that game's score.
export function getPrizeTiles(){
  const list = load();
  const order = [];
  const groups = {};
  for(const entry of list){
    // Old storage format was a plain emoji string, with no score recorded.
    const emoji = typeof entry === "string" ? entry : entry.emoji;
    const score = typeof entry === "string" ? null : entry.score;
    if(!(emoji in groups)){ groups[emoji] = []; order.push(emoji); }
    groups[emoji].push({ emoji, scale: sizeScaleForScore(score) });
  }
  const tiles = [];
  for(const emoji of order) tiles.push(...groups[emoji]);
  return tiles;
}
