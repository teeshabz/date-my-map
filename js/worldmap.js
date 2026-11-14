// Date My Map: the pixel world map on the result screen.
//
// A 46 × 21 grid. LAND lists, for each row, the runs of black cells as
// [first column, last column]. Rows that aren't listed are empty sea.

const COLS = 46;
const ROWS = 21;

const LAND = {
  3: [[9, 20], [25, 37]],
  4: [[2, 14], [17, 19], [22, 42]],
  5: [[3, 16], [22, 42]],
  6: [[6, 15], [22, 24], [27, 42]],
  7: [[7, 14], [21, 41]],
  8: [[8, 12], [20, 38]],
  9: [[11, 13], [21, 26], [31, 34], [36, 39]],
  10: [[12, 13], [21, 27], [32, 34], [36, 38]],
  11: [[13, 18], [22, 27], [33, 33], [37, 39]],
  12: [[14, 18], [23, 26], [36, 41]],
  13: [[14, 17], [24, 26], [28, 28], [36, 41]],
  14: [[14, 16], [24, 25], [36, 41]],
  15: [[14, 15], [37, 40]],
  16: [[14, 14]],
  17: [[14, 14]],
};

export function worldMapSvg() {
  const land = Object.entries(LAND)
    .flatMap(([row, runs]) =>
      runs.map(([a, b]) => `<rect x="${a}" y="${row}" width="${b - a + 1}" height="1" />`),
    )
    .join("");

  return `
    <svg viewBox="0 0 ${COLS} ${ROWS}" role="img" aria-label="Pixel world map" shape-rendering="crispEdges">
      <defs>
        <pattern id="map-grid" width="1" height="1" patternUnits="userSpaceOnUse">
          <path d="M1 0V1H0" fill="none" stroke="#E2E2E2" stroke-width="0.08" />
        </pattern>
      </defs>
      <rect width="${COLS}" height="${ROWS}" fill="#FFFFFF" />
      <rect width="${COLS}" height="${ROWS}" fill="url(#map-grid)" />
      <g fill="#000000">${land}</g>
    </svg>`;
}
