// Date My Map: draws the pixel world map as SVG, for the result screen (big,
// black, on a faint grid) and the timeline cards (small, grey, with a dot).

import { LAND, MAP_COLS, MAP_ROWS, cellAt } from "../data/worldmap.js";

// The land in some rows as a single <path>, one box per run of land cells.
// One shape (not a <rect> per row) avoids hairline seams between rows; boxes
// are a touch taller than a row so separate paths overlap too.
function landPath(fromRow, toRow) {
  let d = "";
  for (let row = fromRow; row < toRow; row++) {
    const line = LAND[row];
    for (let c = 0; c < MAP_COLS; c++) {
      if (line[c] !== "#") continue;
      let end = c;
      while (line[end + 1] === "#") end++;
      d += `M${c} ${row}h${end - c + 1}v1.04h${-(end - c + 1)}z`;
      c = end;
    }
  }
  return `<path d="${d}" />`;
}

const ROWS_PER_STEP = 3; // the result map fills in this many rows at a time

// options:
//   land:    land colour
//   grid:    draw the faint background grid
//   animate: wrap each row so CSS can fill the map in a few rows at a time
//   dot:     [lat, lon] for a black 2 × 2 dot
//   label:   accessible name; without one the map is decorative
export function pixelMapSvg({ land = "#000000", grid = false, animate = false, dot = null, label = "" } = {}) {
  let rows = "";
  if (animate) {
    for (let r = 0, group = 0; r < MAP_ROWS; r += ROWS_PER_STEP, group++) {
      rows += `<g class="map-row" style="--group: ${group}">${landPath(r, Math.min(r + ROWS_PER_STEP, MAP_ROWS))}</g>`;
    }
  } else {
    rows = landPath(0, MAP_ROWS);
  }

  let dotRect = "";
  if (dot) {
    const { row, col } = cellAt(...dot);
    const x = Math.min(col, MAP_COLS - 2);
    const y = Math.min(row, MAP_ROWS - 2);
    dotRect = `<rect x="${x}" y="${y}" width="2" height="2" fill="#000000" />`;
  }

  const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`;
  const gridLayer = grid
    ? `<defs><pattern id="map-grid" width="1" height="1" patternUnits="userSpaceOnUse">
         <path d="M1 0V1H0" fill="none" stroke="#E2E2E2" stroke-width="0.08" />
       </pattern></defs>
       <rect width="${MAP_COLS}" height="${MAP_ROWS}" fill="url(#map-grid)" />`
    : "";

  return `<svg viewBox="0 0 ${MAP_COLS} ${MAP_ROWS}" ${a11y} shape-rendering="crispEdges">
    ${gridLayer}<g fill="${land}">${rows}</g>${dotRect}
  </svg>`;
}
