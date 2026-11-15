// Date My Map: the screens. All dating rules live in logic.js.

import { clues, EARLIEST } from "../data/clues.js";
import { currentRange, nextClue, knownList, formatRange, formatAnswerYears } from "./logic.js";
import { playClick, playWin } from "./sound.js";
import { burst, popSoon, cancelPop } from "./notes.js";
import { pixelMapSvg } from "./pixelmap.js";
import { h, svgBox, mascot, learnMore, timelineLink } from "./ui.js";
import { timelineScreen } from "./timeline.js";

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
// history (no next question means we're done). The timeline lives at its own
// address (#timeline) and sits on top of whatever screen you came from, so
// the back button returns there.
let screen = "welcome";
let history = [];

const rangeOf = (hist) => currentRange(hist, clueById, EARLIEST, NOW);
const onTimeline = () => location.hash === "#timeline";

// ── Pop-up notes ───────────────────────────────────────────────────────────
// "down to 1 decade!" shows on the page right after the answer that first
// narrows the range to 10 years or less. Otherwise the fun lines sit on fixed
// question numbers. The result page always gets "case closed!".

const FUN_LINE_ON_QUESTION = {
  2: "isn't this fun",
  6: "hope ur having a good day",
};

function noteForQuestion() {
  const last = history.at(-1);
  if (last && last.choice !== "skip") {
    const before = rangeOf(history.slice(0, -1));
    const after = rangeOf(history);
    if (after.hi - after.lo <= 10 && before.hi - before.lo > 10) return "down to 1 decade!";
  }
  return FUN_LINE_ON_QUESTION[history.length + 1] ?? null;
}

// ── Actions ────────────────────────────────────────────────────────────────

function startDating() {
  screen = "dating";
  history = [];
  render();
}

// Back to the welcome screen from anywhere, including the timeline.
function goHome() {
  screen = "welcome";
  history = [];
  if (onTimeline()) window.history.pushState(null, "", location.pathname + location.search);
  render();
}

function answer(clue, choice) {
  history = [...history, { id: clue.id, choice }];
  render();
  // Arriving at the result by answering gets the win jingle. (Coming back to
  // it from the timeline doesn't.)
  if (app.querySelector(".result")) playWin();
}

// Tapping a "What we know" row goes back to that question and clears every
// answer after it.
function goBackTo(index) {
  history = history.slice(0, index);
  render();
}

// ── Pieces ─────────────────────────────────────────────────────────────────

// The small mascot at the top of every screen but the welcome screen.
function homeButton() {
  return h("button", { class: "home", onclick: goHome, "aria-label": "Home" }, mascot("home-mascot"));
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

// The result screen's framed pixel map: it fills in a few rows at a time, the
// three sparkles blink, then the "case closed!" burst pops in.
function worldMap() {
  return h(
    "div",
    { class: "map" },
    svgBox("map-frame sunken", pixelMapSvg({ grid: true, animate: true, label: "Pixel world map" })),
    h("span", { class: "sparkle sparkle-tl", "aria-hidden": "true" }),
    h("span", { class: "sparkle sparkle-bl", "aria-hidden": "true" }),
    h("span", { class: "sparkle sparkle-br", "aria-hidden": "true" }),
    burst("case closed!", "note-on-map"),
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
    h("button", { class: "start raised", onclick: startDating }, "Let's find out"),
    timelineLink("or see the timeline of map changes"),
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
    h("p", { class: "fact" }, clue.fact, " ", learnMore(clue.wiki)),
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
    timelineLink("see the timeline of map changes"),
  );
}

function render() {
  cancelPop();
  let page;
  if (onTimeline()) {
    page = timelineScreen(homeButton());
  } else if (screen === "welcome") {
    page = welcomeScreen();
  } else {
    const range = rangeOf(history);
    const clue = nextClue(history, clues, clueById, EARLIEST, NOW);
    page = clue ? questionScreen(clue, range) : resultScreen(range);
  }
  app.replaceChildren(page);
  // Question pages pop their note with a sound. The result page's burst pops
  // in silently, since it comes with the win jingle.
  if (page.querySelector(".note") && !page.classList.contains("result")) popSoon();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", render);
render();
