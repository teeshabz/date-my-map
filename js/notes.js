// Date My Map: the comic-burst pop-up notes.
//
// A note belongs to the page it's on: it pops in about a second after the
// page appears and stays until the user moves on. It never moves the layout
// and never needs dismissing.

import { playPop } from "./sound.js";

const DELAY_MS = 1000; // keep in step with the animation delay in style.css

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

// The note element. Where it sits is up to the page's CSS (via extraClass).
export function burst(text, extraClass = "") {
  const note = document.createElement("div");
  note.className = `note ${extraClass}`.trim();
  note.setAttribute("role", "status");
  note.innerHTML = BURST_SVG;
  const label = document.createElement("span");
  label.className = "note-text";
  label.textContent = text;
  note.append(label);
  return note;
}

// The pop sound, timed to land with the note. Re-drawing the page cancels a
// pop that hasn't played yet.
let popTimer = null;

export function popSoon() {
  clearTimeout(popTimer);
  popTimer = setTimeout(playPop, DELAY_MS);
}

export function cancelPop() {
  clearTimeout(popTimer);
}
