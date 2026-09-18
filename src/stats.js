// Local play stats: sessions, per-game scores, and common mistakes.
// Stored entirely in localStorage on this device — nothing ever leaves it.

const STORAGE_KEY = "addItUpStats";
const ABANDON_MS = 15 * 60 * 1000;   // sessions longer than this are treated as abandoned, not counted
const HEARTBEAT_MS = 5000;
const MAX_GAME_HISTORY = 500;        // plenty for the 30-game/30-day charts; keeps storage bounded
const MISTAKE_LOG_DAYS = 7;          // "trickiest problems" only looks at recent misses, not the whole history
const LATENCY_LOG_DAYS = 30;         // response-time baseline window (§17.6 step 1) — passive, never shown during play
const SUBITIZE_MAX = 4;              // operands this size or smaller are typically recognized at a glance, not counted

function dayKey(t){
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function blank(){
  return {
    v: 1,
    session: { totalMs: 0, count: 0, minMs: null, maxMs: null },
    games: { totalScore: 0, count: 0, bestScore: 0, bestStreak: 0, totalCorrect: 0, totalWrong: 0, history: [] },
    mistakeLog: [], // [{a,b,t}] — recent wrong submissions, pruned to MISTAKE_LOG_DAYS on every write
    latencyLog: [], // [{presentation,maxOperand,ms,t}] — one entry per problem's first attempt, pruned to LATENCY_LOG_DAYS
    days: {},
    active: null
  };
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return blank();
    const data = JSON.parse(raw);
    const b = blank();
    return {
      ...b, ...data,
      session: { ...b.session, ...data.session },
      games: { ...b.games, ...data.games, history: Array.isArray(data.games?.history) ? data.games.history : [] },
      mistakeLog: Array.isArray(data.mistakeLog) ? data.mistakeLog : [],
      latencyLog: Array.isArray(data.latencyLog) ? data.latencyLog : [],
      days: data.days || {}
    };
  }catch(e){ return blank(); }
}

function save(data){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }catch(e){ /* storage unavailable (private mode, quota) — stats just won't persist */ }
}

function finalizeSession(data, active, endTime){
  data.days[dayKey(active.start)] = true;
  const duration = endTime - active.start;
  if(duration > 0 && duration <= ABANDON_MS){
    const s = data.session;
    s.totalMs += duration; s.count += 1;
    s.minMs = s.minMs === null ? duration : Math.min(s.minMs, duration);
    s.maxMs = s.maxMs === null ? duration : Math.max(s.maxMs, duration);
  }
  data.active = null;
}

// A "session" is active gameplay time only — it starts when a theme is
// picked (startSession) and ends the moment the player returns to the
// theme-picker screen (endSession), so browsing the picker or the stats
// screen is never counted as play time.

export function initStats(){
  // Recover from a crash/force-quit that happened mid-game last time, using
  // the last heartbeat as the best estimate of when play actually stopped.
  const data = load();
  if(data.active) finalizeSession(data, data.active, data.active.last || data.active.start);
  data.active = null;
  save(data);

  setInterval(() => {
    const d = load();
    if(d.active){ d.active.last = Date.now(); save(d); }
  }, HEARTBEAT_MS);

  const endNow = () => {
    const d = load();
    if(d.active){ finalizeSession(d, d.active, Date.now()); save(d); }
  };
  window.addEventListener("pagehide", endNow);
  window.addEventListener("beforeunload", endNow);
}

export function startSession(){
  const data = load();
  if(data.active) return; // already counting
  const now = Date.now();
  data.active = { start: now, last: now };
  save(data);
}

export function endSession(){
  const data = load();
  if(data.active){ finalizeSession(data, data.active, Date.now()); save(data); }
}

export function recordGame({ wrongCount, theme, streak }){
  const data = load();
  const score = Math.max(0, 10 - wrongCount);
  const g = data.games;
  g.totalScore += score; g.count += 1;
  g.bestScore = Math.max(g.bestScore, score);
  g.bestStreak = Math.max(g.bestStreak, streak || 0);
  g.totalCorrect += 10;
  g.totalWrong += wrongCount;
  g.history.push({ t: Date.now(), score, theme });
  if(g.history.length > MAX_GAME_HISTORY) g.history.splice(0, g.history.length - MAX_GAME_HISTORY);
  save(data);
}

export function recordMistake(a, b){
  const data = load();
  const cutoff = Date.now() - MISTAKE_LOG_DAYS * 86400000;
  data.mistakeLog = data.mistakeLog.filter(m => m.t >= cutoff); // drop entries older than the window as we go
  data.mistakeLog.push({ a, b, t: Date.now() });
  save(data);
}

export function getSummary(){
  const data = load();
  const { session, games, days, active } = data;
  const daysPlayed = new Set(Object.keys(days));
  if(active) daysPlayed.add(dayKey(active.start)); // today counts even before this session finalizes
  const avgSessionMs = session.count ? session.totalMs / session.count : 0;
  const avgScore = games.count ? games.totalScore / games.count : 0;
  const totalAnswers = games.totalCorrect + games.totalWrong;
  const accuracy = totalAnswers ? games.totalCorrect / totalAnswers : null;

  // "Favorite" reflects recent taste, not a fixed all-time lead one theme
  // could never be dislodged from — so tally only the last 7 days.
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const recentCounts = {};
  for(const g of games.history){
    if(g.t >= sevenDaysAgo) recentCounts[g.theme] = (recentCounts[g.theme] || 0) + 1;
  }
  let favoriteTheme = null, favCount = 0;
  for(const [name, count] of Object.entries(recentCounts)){ if(count > favCount){ favCount = count; favoriteTheme = name; } }
  return {
    totalPlayMs: session.totalMs,
    avgSessionMs,
    shortestSessionMs: session.minMs,
    longestSessionMs: session.maxMs,
    sessionCount: session.count,
    gamesPlayed: games.count,
    avgScore,
    bestScore: games.bestScore,
    bestStreak: games.bestStreak,
    accuracy,
    daysPlayed: daysPlayed.size,
    favoriteTheme
  };
}

export function getLast30Games(){
  return load().games.history.slice(-30);
}

export function getLast30DaysSeries(){
  const data = load();
  const byDay = {};
  for(const g of data.games.history){
    const key = dayKey(g.t);
    (byDay[key] || (byDay[key] = [])).push(g.score);
  }
  const now = Date.now();
  const out = [];
  for(let i = 29; i >= 0; i--){
    const t = now - i * 86400000;
    const key = dayKey(t);
    const scores = byDay[key];
    out.push({ dayOffset: 29 - i, date: key, avg: scores ? scores.reduce((a, b) => a + b, 0) / scores.length : null });
  }
  return out;
}

// Scoped to the last 7 days (MISTAKE_LOG_DAYS) so a rough patch early on — or
// a fact the child has since mastered — doesn't sit pinned at the top forever;
// this tracks *current* trouble spots, same reasoning as §11's "Favorite this
// week" being 7-day rather than all-time.
export function getTopMistakes(limit = 10){
  const data = load();
  const cutoff = Date.now() - MISTAKE_LOG_DAYS * 86400000;
  const counts = {};
  for(const m of data.mistakeLog){
    if(m.t < cutoff) continue;
    const key = `${m.a}+${m.b}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

// Response-time baseline (§17.6 step 1): purely passive — nothing reads this
// during play, no timer or countdown is ever shown to the child. One sample
// per problem, its *first* attempt only (see problem.js/main.js), so retries
// after a wrong answer never skew it. maxOperand (the larger of a/b) is kept
// alongside presentation because operand size confounds the comparison —
// emoji/pips add a "count the pile" step that scales with the larger operand
// and digits doesn't have at all, so raw presentation medians alone can't
// tell a slow-representation apart from a slow-because-it's-big problem.
export function recordLatency(presentation, ms, maxOperand){
  if(!Number.isFinite(ms) || ms < 0) return; // guard against clock/tab-switch weirdness
  const data = load();
  const cutoff = Date.now() - LATENCY_LOG_DAYS * 86400000;
  data.latencyLog = data.latencyLog.filter(e => e.t >= cutoff);
  data.latencyLog.push({ presentation, maxOperand, ms: Math.round(ms), t: Date.now() });
  save(data);
}

function median(sortedAsc){
  const n = sortedAsc.length;
  if(!n) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? sortedAsc[mid] : (sortedAsc[mid - 1] + sortedAsc[mid]) / 2;
}

function summarizeLatencies(msList){
  if(!msList.length) return null;
  const sorted = [...msList].sort((a, b) => a - b);
  return { min: sorted[0], median: median(sorted), max: sorted[sorted.length - 1], count: msList.length };
}

// { digits, emoji, pips, combined }, each null or {min, median, max, count}
// (ms), over the last 30 days — lets you see whether one presentation is
// consistently slower before deciding what "improvement" should even mean.
// Also `bySize`: the same four groups, each split into small (max operand
// ≤ SUBITIZE_MAX, glance-recognized) vs large (likely counted) — since
// operand size confounds the presentation comparison (see recordLatency),
// this is what actually separates "this representation is slow" from
// "big numbers are slow, and this representation happens to show them raw."
export function getLatencyStats(){
  const data = load();
  const cutoff = Date.now() - LATENCY_LOG_DAYS * 86400000;
  const recent = data.latencyLog.filter(e => e.t >= cutoff);

  const byPresentation = { digits: [], emoji: [], pips: [] };
  const bySize = {
    digits: { small: [], large: [] },
    emoji: { small: [], large: [] },
    pips: { small: [], large: [] },
    combined: { small: [], large: [] }
  };
  for(const e of recent){
    if(byPresentation[e.presentation]) byPresentation[e.presentation].push(e.ms);
    const bucket = e.maxOperand <= SUBITIZE_MAX ? "small" : "large";
    if(bySize[e.presentation]) bySize[e.presentation][bucket].push(e.ms);
    bySize.combined[bucket].push(e.ms);
  }
  const summarizeSize = g => ({ small: summarizeLatencies(g.small), large: summarizeLatencies(g.large) });

  return {
    digits: summarizeLatencies(byPresentation.digits),
    emoji: summarizeLatencies(byPresentation.emoji),
    pips: summarizeLatencies(byPresentation.pips),
    combined: summarizeLatencies(recent.map(e => e.ms)),
    bySize: {
      digits: summarizeSize(bySize.digits),
      emoji: summarizeSize(bySize.emoji),
      pips: summarizeSize(bySize.pips),
      combined: summarizeSize(bySize.combined)
    }
  };
}

// 7-day accuracy for the mastery badge (§12-adjacent feature) — same
// correct/(correct+wrong) formula as the all-time Accuracy stat above, just
// scoped to games finished in the last 7 days instead of all-time.
export function getPrecision7d(){
  const data = load();
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const recent = data.games.history.filter(g => g.t >= sevenDaysAgo);
  if(!recent.length) return { hasData: false, precision: 0, correctTotal: 0, wrongTotal: 0 };
  let correctTotal = 0, wrongTotal = 0;
  for(const g of recent){ correctTotal += 10; wrongTotal += Math.max(0, 10 - g.score); }
  return { hasData: true, precision: correctTotal / (correctTotal + wrongTotal) * 100, correctTotal, wrongTotal };
}

export function resetStats(){
  const data = load();
  const fresh = blank();
  fresh.active = data.active; // keep the session currently in progress running
  save(fresh);
}
