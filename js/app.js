// Date My Map: the screens. All dating rules live in logic.js.

import { clues, EARLIEST } from "../data/clues.js";
import { currentRange, nextClue, knownList, formatRange, formatAnswerYears } from "./logic.js";

const NOW = new Date().getFullYear();
const clueById = Object.fromEntries(clues.map((c) => [c.id, c]));
const app = document.getElementById("app");

// The only state: what the user has tapped so far.
let history = [];

// Tiny helper for building elements: h("p", { class: "fact" }, "text").
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value);
  }
  el.append(...children);
  return el;
}

function answer(clue, choice) {
  history = [...history, { id: clue.id, choice }];
  render();
}

// Tapping a "What we know" row goes back to that question and clears every
// answer after it.
function goBackTo(index) {
  history = history.slice(0, index);
  render();
}

// ── Pieces ─────────────────────────────────────────────────────────────────

function timeline(range) {
  const span = NOW - EARLIEST;
  const left = ((range.lo - EARLIEST) / span) * 100;
  const width = ((range.hi - range.lo) / span) * 100;
  return h(
    "div",
    {},
    h(
      "div",
      { class: "timeline sunken", role: "img", "aria-label": `Timeline from ${EARLIEST} to now` },
      h("div", { class: "timeline-block", style: `left: ${left}%; width: ${width}%` }),
    ),
    h("div", { class: "timeline-labels" }, h("span", {}, String(EARLIEST)), h("span", {}, "Now")),
  );
}

function knownBox(label) {
  const rows = knownList(history, clueById).map((row) =>
    h(
      "li",
      {},
      h(
        "button",
        { class: "known-row", onclick: () => goBackTo(row.index), title: "Change this answer" },
        h("span", {}, row.clue),
        h("span", { class: "known-years" }, formatAnswerYears(row.from, row.to)),
      ),
    ),
  );
  return h(
    "section",
    { class: "known" },
    h("p", { class: "known-label" }, label),
    h("ul", { class: "known-list sunken" }, ...rows),
  );
}

// ── Screens ────────────────────────────────────────────────────────────────

function questionScreen(clue, range) {
  return h(
    "div",
    { class: "screen" },
    h("p", { class: "range", "aria-live": "polite" }, formatRange(range, NOW)),
    timeline(range),
    h("h1", { class: "question" }, clue.question),
    h("p", { class: "fact" }, clue.fact),
    h(
      "div",
      { class: "answers" },
      h("button", { class: "answer raised", onclick: () => answer(clue, "older") }, clue.older.label),
      h("button", { class: "answer raised", onclick: () => answer(clue, "newer") }, clue.newer.label),
    ),
    h("button", { class: "skip", onclick: () => answer(clue, "skip") }, "Skip"),
    knownBox("What we know"),
  );
}

// Placeholder until the result screen is built (step 3).
function resultScreen(range) {
  return h(
    "div",
    { class: "screen" },
    h("p", { class: "range" }, formatRange(range, NOW)),
    timeline(range),
    knownBox("How we know"),
  );
}

function render() {
  const range = currentRange(history, clueById, EARLIEST, NOW);
  const clue = nextClue(history, clues, clueById, EARLIEST, NOW);
  app.replaceChildren(clue ? questionScreen(clue, range) : resultScreen(range));
}

render();
