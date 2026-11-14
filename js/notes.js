// Date My Map: the comic-burst pop-up notes in the top right.
//
// Notes live in their own layer outside the screens, so re-drawing a screen
// never removes one early, and they never move the layout or need dismissing.

import { playPop } from "./sound.js";

const SHOW_MS = 2600;

// The zigzag burst outline: a star with many short points, squashed into an
// oval so it's wider than it is tall.
function burstPoints(width, height, spikes = 14) {
  const cx = width / 2;
  const cy = height / 2;
  const points = [];
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const reach = i % 2 === 0 ? 1 : 0.72;
    const x = cx + Math.cos(angle) * (width / 2 - 2) * reach;
    const y = cy + Math.sin(angle) * (height / 2 - 2) * reach;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

const BURST_SVG = `
  <svg viewBox="0 0 130 96" aria-hidden="true">
    <polygon points="${burstPoints(130, 96)}" fill="#FFFFFF" stroke="#000000" stroke-width="2" stroke-linejoin="miter" />
  </svg>`;

let layer = null;
let current = null;

function getLayer() {
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "note-layer";
    layer.setAttribute("aria-live", "polite");
    document.body.append(layer);
  }
  return layer;
}

export function showNote(text) {
  current?.remove();

  const note = document.createElement("div");
  note.className = "note";
  note.innerHTML = BURST_SVG;
  const label = document.createElement("span");
  label.className = "note-text";
  label.textContent = text;
  note.append(label);

  getLayer().append(note);
  current = note;
  playPop();

  setTimeout(() => {
    note.classList.add("note-out");
    setTimeout(() => note.remove(), 400);
  }, SHOW_MS);
}
