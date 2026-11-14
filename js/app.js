// Date My Map: the screens. All dating rules live in logic.js.

import { clues, EARLIEST } from "../data/clues.js";
import { currentRange, nextClue, knownList, formatRange, formatAnswerYears } from "./logic.js";
import { playClick, playWin } from "./sound.js";
import { burst, popSoon, cancelPop } from "./notes.js";
import { worldMapSvg } from "./worldmap.js";

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

const rangeOf = (hist) => currentRange(hist, clueById, EARLIEST, NOW);

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
// "Down to 1 decade!" shows on the page right after the answer that first
// narrows the range to 10 years or less. Otherwise the fun lines sit on fixed
// question numbers. The result page always gets "Case closed!".

const FUN_LINE_ON_QUESTION = {
  2: "isn't this fun",
  4: "bet you didn't know that huh",
  6: "hope ur having a good day",
};

function noteForQuestion() {
  const last = history.at(-1);
  if (last && last.choice !== "skip") {
    const before = rangeOf(history.slice(0, -1));
    const after = rangeOf(history);
    if (after.hi - after.lo <= 10 && before.hi - before.lo > 10) return "Down to 1 decade!";
  }
  return FUN_LINE_ON_QUESTION[history.length + 1] ?? null;
}

// ── Actions ────────────────────────────────────────────────────────────────

function startDating() {
  screen = "dating";
  history = [];
  render();
}

function goHome() {
  screen = "welcome";
  history = [];
  render();
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

// While answering, each row is a button that goes back to that question.
function questionRow(row) {
  return h(
    "button",
    { class: "known-row", onclick: () => goBackTo(row.index), title: "Change this answer" },
    h("span", {}, row.clue),
    h("span", { class: "known-years" }, formatAnswerYears(row.from, row.to)),
  );
}

// "learn more ↗": opens the clue's Wikipedia article in a new tab.
function learnMore(wiki, className) {
  return h(
    "a",
    { class: className, href: `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki)}`, target: "_blank", rel: "noopener" },
    "learn more ↗",
  );
}

// On the result, each row links to its Wikipedia article.
function resultRow(row) {
  return h(
    "div",
    { class: "known-row known-row-result" },
    h("span", {}, row.clue, learnMore(row.wiki, "read-more")),
    h("span", { class: "known-years" }, formatAnswerYears(row.from, row.to)),
  );
}

function knownBox(label, makeRow, extraClass = "") {
  const rows = knownList(history, clueById).map((row) => h("li", {}, makeRow(row)));
  return h(
    "section",
    { class: `known ${extraClass}`.trim() },
    h("p", { class: "known-label" }, label),
    h("ul", { class: "known-list sunken" }, ...rows),
  );
}

// The framed pixel map with crop marks, for the result screen.
function worldMap() {
  const frame = h("div", { class: "map-frame sunken" });
  frame.innerHTML = worldMapSvg();
  return h(
    "div",
    { class: "map" },
    frame,
    h("span", { class: "crop crop-tl", "aria-hidden": "true" }),
    h("span", { class: "crop crop-bl", "aria-hidden": "true" }),
    h("span", { class: "crop crop-br", "aria-hidden": "true" }),
    burst("Case closed!", "note-on-map"),
  );
}

// ── Screens ────────────────────────────────────────────────────────────────

function welcomeScreen() {
  return h(
    "div",
    { class: "screen welcome" },
    mascot("welcome-mascot"),
    h("h1", { class: "title" }, "Date my map"),
    h("p", { class: "tagline" }, "what year is your map from?"),
    h("button", { class: "start raised", onclick: startDating }, "Let's date this thing"),
    h(
      "a",
      { class: "credit", href: "https://www.instagram.com/tali.files/", target: "_blank", rel: "noopener" },
      "@tali.files",
    ),
  );
}

function questionScreen(clue, range) {
  const note = noteForQuestion();
  return h(
    "div",
    { class: "screen" },
    homeButton(),
    ...(note ? [burst(note, "note-corner")] : []),
    h("p", { class: "range", "aria-live": "polite" }, formatRange(range, NOW)),
    timeline(range),
    h("h1", { class: "question" }, clue.question),
    h("p", { class: "fact" }, clue.fact, " ", learnMore(clue.wiki, "learn-more")),
    h(
      "div",
      { class: "answers" },
      h("button", { class: "answer raised", onclick: () => answer(clue, "older") }, clue.older.label),
      h("button", { class: "answer raised", onclick: () => answer(clue, "newer") }, clue.newer.label),
    ),
    h("button", { class: "skip", onclick: () => answer(clue, "skip") }, "Skip"),
    knownBox("What we know", questionRow),
  );
}

function resultScreen(range) {
  return h(
    "div",
    { class: "screen result" },
    homeButton(),
    worldMap(),
    h("p", { class: "result-intro" }, "Your map was made between"),
    h("p", { class: "range range-big" }, formatRange(range, NOW)),
    timeline(range),
    knownBox("How we know", resultRow, "known-result"),
    h("button", { class: "again raised", onclick: goHome }, "Date another map"),
  );
}

function render() {
  cancelPop();
  let page;
  if (screen === "welcome") {
    page = welcomeScreen();
  } else {
    const range = rangeOf(history);
    const clue = nextClue(history, clues, clueById, EARLIEST, NOW);
    page = clue ? questionScreen(clue, range) : resultScreen(range);
  }
  app.replaceChildren(page);
  // The result page gets the win jingle; its "Case closed!" burst pops in
  // silently so the two sounds don't overlap.
  if (page.classList.contains("result")) playWin();
  else if (page.querySelector(".note")) popSoon();
  window.scrollTo(0, 0);
}

render();
