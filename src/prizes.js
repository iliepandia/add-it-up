// Persistent prize collection: one prize is added per finished game, drawn
// from the same WIN_END glyph shown on the trophy screen. Stored entirely in
// localStorage on this device, kept separate from stats.js on purpose so
// "Reset stats" never wipes a child's collected prizes.

const STORAGE_KEY = "addItUpPrizes";

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

export function addPrize(emoji){
  const list = load();
  list.push(emoji);
  save(list);
}

// Flat list of prize tiles to render, same-emoji prizes clustered together
// (in the order each type was first won) so wins collected in random order
// still group on screen instead of scattering by win date.
export function getPrizeTiles(){
  const list = load();
  const order = [];
  const counts = {};
  for(const emoji of list){
    if(!(emoji in counts)){ counts[emoji] = 0; order.push(emoji); }
    counts[emoji]++;
  }
  const tiles = [];
  for(const emoji of order) for(let i = 0; i < counts[emoji]; i++) tiles.push(emoji);
  return tiles;
}
