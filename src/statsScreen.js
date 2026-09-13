// The stats screen: number tiles, two small hand-drawn SVG charts, and the
// trickiest-problems list. Reachable only from the theme-picker screen.

import {
  statsScreen, statsGrid, chartGames, chartMonth, mistakesList,
  statsClose, statsResetBtn, resetConfirm, resetCancel, resetConfirmBtn
} from "./dom.js";
import { getSummary, getLast30Games, getLast30DaysSeries, getTopMistakes, resetStats } from "./stats.js";

const THEME_LABEL = { classic: "Classic", nature: "Nature", space: "Space", animal: "Animals" };
const SVG_NS = "http://www.w3.org/2000/svg";

function formatDuration(ms){
  if(!ms || ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60;
  if(h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if(m) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function svgEl(tag, attrs){
  const el = document.createElementNS(SVG_NS, tag);
  for(const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function tile(label, value){
  const d = document.createElement("div"); d.className = "stat-tile";
  const v = document.createElement("div"); v.className = "stat-value"; v.textContent = value;
  const l = document.createElement("div"); l.className = "stat-label"; l.textContent = label;
  d.append(v, l);
  return d;
}

function emptyNote(text){
  const p = document.createElement("p"); p.className = "chart-empty"; p.textContent = text;
  return p;
}

function renderTiles(){
  const s = getSummary();
  statsGrid.innerHTML = "";
  const rows = [
    ["Games played", s.gamesPlayed || "—"],
    ["Average score", s.gamesPlayed ? s.avgScore.toFixed(1) + " / 10" : "—"],
    ["Best score", s.gamesPlayed ? s.bestScore + " / 10" : "—"],
    ["Accuracy", s.accuracy != null ? Math.round(s.accuracy * 100) + "%" : "—"],
    ["Longest streak", s.bestStreak || "—"],
    ["Total play time", formatDuration(s.totalPlayMs)],
    ["Average session", formatDuration(s.avgSessionMs)],
    ["Shortest session", formatDuration(s.shortestSessionMs)],
    ["Longest session", formatDuration(s.longestSessionMs)],
    ["Days played", s.daysPlayed || "—"]
  ];
  if(s.favoriteTheme) rows.push(["Favorite world", THEME_LABEL[s.favoriteTheme] || s.favoriteTheme]);
  rows.forEach(([label, value]) => statsGrid.appendChild(tile(label, value)));
}

function renderGridlines(svg, W, H, pad){
  [0, 5, 10].forEach(v => {
    const y = H - pad - (v / 10) * (H - pad * 2);
    svg.appendChild(svgEl("line", { x1: pad, x2: W - pad, y1: y, y2: y, class: "chart-grid" }));
  });
}

function renderGamesChart(){
  chartGames.innerHTML = "";
  const games = getLast30Games();
  if(!games.length){ chartGames.appendChild(emptyNote("Play a few games to see your progress here.")); return; }
  const W = 300, H = 110, pad = 6, n = games.length;
  const bw = (W - pad * 2) / n;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", class: "chart-svg" });
  renderGridlines(svg, W, H, pad);
  games.forEach((g, i) => {
    const barH = Math.max((g.score / 10) * (H - pad * 2), 1.5);
    const x = pad + i * bw, y = H - pad - barH;
    svg.appendChild(svgEl("rect", { x: x + bw * 0.15, y, width: Math.max(bw * 0.7, 1), height: barH, rx: 2, class: "chart-bar" }));
  });
  chartGames.appendChild(svg);
}

function renderMonthChart(){
  chartMonth.innerHTML = "";
  const days = getLast30DaysSeries();
  if(!days.some(d => d.avg != null)){ chartMonth.appendChild(emptyNote("No games in the last 30 days yet.")); return; }
  const W = 300, H = 110, pad = 6;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", class: "chart-svg" });
  renderGridlines(svg, W, H, pad);
  const xFor = i => pad + (i / 29) * (W - pad * 2);
  const yFor = v => H - pad - (v / 10) * (H - pad * 2);
  let path = "";
  days.forEach(d => {
    if(d.avg == null) return;
    path += `${path ? "L" : "M"}${xFor(d.dayOffset).toFixed(1)},${yFor(d.avg).toFixed(1)} `;
  });
  svg.appendChild(svgEl("path", { d: path.trim(), class: "chart-line", fill: "none" }));
  days.forEach(d => {
    if(d.avg == null) return;
    svg.appendChild(svgEl("circle", { cx: xFor(d.dayOffset), cy: yFor(d.avg), r: 2.6, class: "chart-dot" }));
  });
  chartMonth.appendChild(svg);
}

function renderMistakes(){
  mistakesList.innerHTML = "";
  const top = getTopMistakes(10);
  if(!top.length){
    const li = document.createElement("li"); li.className = "mistake-empty";
    li.textContent = "No mistakes yet — great job!";
    mistakesList.appendChild(li);
    return;
  }
  top.forEach(({ key, count }) => {
    const li = document.createElement("li"); li.className = "mistake-row";
    const eq = document.createElement("span"); eq.className = "mistake-eq"; eq.textContent = key.replace("+", " + ");
    const c = document.createElement("span"); c.className = "mistake-count"; c.textContent = `×${count}`;
    li.append(eq, c);
    mistakesList.appendChild(li);
  });
}

function renderAll(){
  renderTiles();
  renderGamesChart();
  renderMonthChart();
  renderMistakes();
  resetConfirm.hidden = true;
}

export function showStats(){
  renderAll();
  statsScreen.classList.add("show");
}

function hideStats(){
  statsScreen.classList.remove("show");
}

export function wireStats(){
  statsClose.addEventListener("click", hideStats);
  statsResetBtn.addEventListener("click", () => { resetConfirm.hidden = false; });
  resetCancel.addEventListener("click", () => { resetConfirm.hidden = true; });
  resetConfirmBtn.addEventListener("click", () => { resetStats(); renderAll(); });
}
