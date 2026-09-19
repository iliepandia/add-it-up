// Hard mode's water-bar drain speed: a single persisted duration (ms to
// fully drain), constant for the whole game it's used in, and adjusted
// between games based on how that game went. Kept in its own localStorage
// key, separate from stats.js, since it's a difficulty setting, not a stat.

const STORAGE_KEY = "addItUpHardWater";
const MIN_MS = 2000, MAX_MS = 20000;
const SPEED_UP = 0.85;  // never drained fully last game (too easy) -> drains faster next time
const SLOW_DOWN = 1.15; // drained more than half the time (too hard) -> drains slower next time

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const data = JSON.parse(raw);
    return Number.isFinite(data?.durationMs) ? data : null;
  }catch(e){ return null; }
}
function save(data){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }catch(e){ /* storage unavailable — falls back to the default every time */ }
}
function clamp(ms){ return Math.max(MIN_MS, Math.min(MAX_MS, ms)); }

// The very first hard game (ever, or after a reset) has no prior hard-game
// result to adjust from, so it starts from this child's own easy-mode max
// latency + 2s (see stats.js's getLatencyStats('easy').combined.max) —
// falling back to a fixed default only if that's somehow unavailable.
export function getHardDrainDuration(easyMaxLatencyMs){
  const data = load();
  if(data) return data.durationMs;
  const base = (Number.isFinite(easyMaxLatencyMs) ? easyMaxLatencyMs : 5000) + 2000;
  const durationMs = clamp(base);
  save({ durationMs });
  return durationMs;
}

// Called once a hard game finishes: bonusStarCount is how many of the
// game's GOAL correct answers beat the bar. 0 bonus stars drained means the
// bar drained on every single problem — the opposite of "never drained
// fully" — so the two extremes read directly off this one count.
export function adjustHardDrainDuration(bonusStarCount, goal){
  const data = load();
  let durationMs = data ? data.durationMs : MIN_MS;
  const drainedCount = goal - bonusStarCount;
  if(drainedCount === 0) durationMs *= SPEED_UP;
  else if(drainedCount > goal / 2) durationMs *= SLOW_DOWN;
  durationMs = clamp(durationMs);
  save({ durationMs });
  return durationMs;
}
