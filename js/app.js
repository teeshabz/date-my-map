// Date My Map: the screens. All dating rules live in logic.js.

import { clues, EARLIEST } from "../data/clues.js";
import { currentRange, nextClue, knownList, formatRange, formatAnswerYears } from "./logic.js";
import { playClick } from "./sound.js";
import { showNote } from "./notes.js";

const NOW = new Date().getFullYear();
const clueById = Object.fromEntries(clues.map((c) => [c.id, c]));
const app = document.getElementById("app");

// Every button tap clicks. Listening in the capture phase plays the sound
// before the tap re-draws the screen.
document.addEventListener("click", (event) => {
  if (event.target.closest("button")) playClick();
}, true);

// The whole state: which screen we're on, and what the user has tapped so far.
// While dating, the question and result screens are both worked out from the
// history (no next question means we're done).
let screen = "welcome";
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

// ── Pop-up notes ───────────────────────────────────────────────────────────
// Kept rare: "Down to 1 decade!" the first time the range gets that narrow,
// and otherwise a fun line now and then. Never after the first answer. Fun
// lines never show two answers in a row, and each at most once per map.

const FUN_LINES = ["isn't this fun", "bet you didn't know that huh", "hope ur having a good day"];
const FUN_CHANCE = 0.4;

let notes;

function resetNotes() {
  notes = { funLeft: [...FUN_LINES], lastAt: -Infinity, decadeShown: false };
}

function maybeShowNote(before, after) {
  const answered = history.filter((h) => h.choice !== "skip").length;
  if (answered < 2) return;

  let text = null;
  if (!notes.decadeShown && after.hi - after.lo <= 10 && before.hi - before.lo > 10) {
    notes.decadeShown = true;
    text = "Down to 1 decade!";
  } else if (answered - notes.lastAt >= 2 && notes.funLeft.length && Math.random() < FUN_CHANCE) {
    const pick = Math.floor(Math.random() * notes.funLeft.length);
    text = notes.funLeft.splice(pick, 1)[0];
  }
  if (text) {
    notes.lastAt = answered;
    showNote(text);
  }
}

// ── Actions ────────────────────────────────────────────────────────────────

function startDating() {
  screen = "dating";
  history = [];
  resetNotes();
  render();
}

function goHome() {
  screen = "welcome";
  history = [];
  render();
}

function answer(clue, choice) {
  const before = currentRange(history, clueById, EARLIEST, NOW);
  history = [...history, { id: clue.id, choice }];
  render();
  if (choice !== "skip") maybeShowNote(before, currentRange(history, clueById, EARLIEST, NOW));
}

// Tapping a "What we know" row goes back to that question and clears every
// answer after it.
function goBackTo(index) {
  history = history.slice(0, index);
  render();
}

// ── Pieces ─────────────────────────────────────────────────────────────────

function mascot(className) {
  return h("img", { class: className, src: "assets/mascot.svg", alt: "" });
}

// The small mascot at the top of the question and result screens. Tapping it
// starts over from the welcome screen.
function homeButton() {
  return h("button", { class: "home", onclick: goHome, "aria-label": "Start over" }, mascot("home-mascot"));
}

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

function knownBox(label, extraClass = "") {
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
    { class: `known ${extraClass}`.trim() },
    h("p", { class: "known-label" }, label),
    h("ul", { class: "known-list sunken" }, ...rows),
  );
}

// ── Screens ────────────────────────────────────────────────────────────────

function welcomeScreen() {
  return h(
    "div",
    { class: "screen welcome" },
    mascot("welcome-mascot"),
    h("h1", { class: "title" }, "Date my map"),
    h("p", { class: "tagline" }, "knowledge is power."),
    h("button", { class: "start raised", onclick: startDating }, "Let's date this thing"),
  );
}

function questionScreen(clue, range) {
  return h(
    "div",
    { class: "screen" },
    homeButton(),
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

function resultScreen(range) {
  return h(
    "div",
    { class: "screen" },
    homeButton(),
    h("p", { class: "result-intro" }, "Your map was made between"),
    h("p", { class: "range range-big" }, formatRange(range, NOW)),
    timeline(range),
    knownBox("How we know", "known-result"),
    h("button", { class: "again raised", onclick: startDating }, "Date another map"),
  );
}

function render() {
  if (screen === "welcome") {
    app.replaceChildren(welcomeScreen());
  } else {
    const range = currentRange(history, clueById, EARLIEST, NOW);
    const clue = nextClue(history, clues, clueById, EARLIEST, NOW);
    app.replaceChildren(clue ? questionScreen(clue, range) : resultScreen(range));
  }
  window.scrollTo(0, 0);
}

render();
