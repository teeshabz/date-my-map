import { test } from "node:test";
import assert from "node:assert/strict";
import { clues, EARLIEST } from "../data/clues.js";
import {
  currentRange,
  nextClue,
  knownList,
  formatRange,
  formatAnswerYears,
} from "../js/logic.js";

const NOW = 2026;
const clueById = Object.fromEntries(clues.map((c) => [c.id, c]));
const next = (history) => nextClue(history, clues, clueById, EARLIEST, NOW);
const range = (history) => currentRange(history, clueById, EARLIEST, NOW);

const allows = (answer, year) =>
  (answer.from === null || answer.from <= year) && (answer.to === null || year <= answer.to);

// Play the whole app for a map from `year`, answering every question truthfully.
function play(year) {
  const history = [];
  for (let clue = next(history); clue; clue = next(history)) {
    const choice = allows(clue.newer, year) ? "newer" : allows(clue.older, year) ? "older" : null;
    assert.ok(choice, `${clue.id} has no truthful answer for a map from ${year}`);
    history.push({ id: clue.id, choice });
  }
  return history;
}

test("every map year from 1800 to now lands on a range containing that year", () => {
  let mostQuestions = 0;
  let widest = 0;
  for (let year = EARLIEST; year <= NOW; year++) {
    const history = play(year);
    const { lo, hi } = range(history);
    assert.ok(lo <= year && year <= hi, `map from ${year} ended at ${lo}–${hi}`);
    mostQuestions = Math.max(mostQuestions, history.length);
    widest = Math.max(widest, hi - lo);
  }
  console.log(`  most questions asked: ${mostQuestions}, widest final range: ${widest} years`);
});

test("the first question splits 1800–now near the middle", () => {
  const first = next([]);
  assert.ok(Math.abs(first.year - (EARLIEST + NOW) / 2) <= 10, `first question was ${first.id}`);
});

test("skipping leaves the range unchanged and moves on", () => {
  const first = next([]);
  const history = [{ id: first.id, choice: "skip" }];
  assert.deepEqual(range(history), range([]));
  assert.notEqual(next(history).id, first.id);
});

test("going back to an earlier answer asks that same question again", () => {
  const history = play(1984);
  for (let i = 0; i < history.length; i++) {
    assert.equal(next(history.slice(0, i)).id, history[i].id);
  }
});

test("What we know lists answers newest first and leaves out skips", () => {
  const history = [
    { id: "zimbabwe", choice: "newer" },
    { id: "iran", choice: "skip" },
    { id: "germany_reunited", choice: "older" },
  ];
  const rows = knownList(history, clueById);
  assert.deepEqual(rows.map((r) => r.clue), ["East Germany shown", "Zimbabwe, not Rhodesia"]);
  assert.deepEqual(rows.map((r) => r.index), [2, 0]);
});

test("every clue has a Wikipedia article for Read more", () => {
  for (const clue of clues) {
    assert.ok(typeof clue.wiki === "string" && clue.wiki.length > 0, `${clue.id} has no wiki article`);
    assert.ok(!clue.wiki.includes(" "), `${clue.id}: use underscores in the wiki title`);
  }
});

test("every clue has a timeline title and a real location", () => {
  for (const clue of clues) {
    assert.ok(clue.title, `${clue.id} has no title`);
    const [lat, lon] = clue.place ?? [];
    assert.ok(Math.abs(lat) <= 90 && Math.abs(lon) <= 180, `${clue.id} has no valid place`);
  }
});

test("display text", () => {
  assert.equal(formatRange({ lo: 1971, hi: 1990 }, NOW), "1971–1990");
  assert.equal(formatRange({ lo: 1990, hi: 1990 }, NOW), "1990");
  assert.equal(formatRange({ lo: 2022, hi: NOW }, NOW), "2022–Now");
  assert.equal(formatAnswerYears(1980, null), "1980–");
  assert.equal(formatAnswerYears(null, 1990), "–1990");
  assert.equal(formatAnswerYears(1949, 1990), "1949–1990");
});
