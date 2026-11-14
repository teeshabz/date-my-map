// Date My Map: the dating logic. No screen code lives here, so the game mode
// can reuse it later.
//
// The whole state is `history`: the list of what the user tapped, in order.
//   [{ id: "zimbabwe", choice: "newer" }, { id: "iran", choice: "skip" }, …]
// Everything else (the range, the next question, "What we know") is worked
// out from it. Going back to an earlier question just means cutting the
// history short at that point.

// Years are inclusive at both ends. A change year belongs to both answers:
// "Rhodesia" allows up to 1980 and "Zimbabwe" allows 1980 onward, because a
// map from 1980 could show either.

const lower = (from) => (from === null ? -Infinity : from);
const upper = (to) => (to === null ? Infinity : to);

// The possible range after applying every answer in the history.
export function currentRange(history, clueById, start, now) {
  let lo = start;
  let hi = now;
  for (const { id, choice } of history) {
    if (choice === "skip") continue;
    const answer = clueById[id][choice];
    lo = Math.max(lo, lower(answer.from));
    hi = Math.min(hi, upper(answer.to));
  }
  return { lo, hi };
}

// A clue is worth asking only if both answers are still possible and either
// one would narrow the range.
//   - The change year has to sit strictly inside the range. Otherwise the
//     range already decides the answer, and asking would waste a tap.
//   - Clues whose names only existed for a while (Zaire, the Soviet Union)
//     also need the whole range to sit inside their window. Otherwise the map
//     could show something the two buttons don't cover.
export function isUseful(clue, { lo, hi }) {
  if (!(lo < clue.year && clue.year < hi)) return false;
  return lower(clue.older.from) <= lo && hi <= upper(clue.newer.to);
}

// The next clue to ask, or null when no clue would narrow the range further.
// Picks the clue whose change year sits closest to the middle of the range,
// so each answer rules out about half the remaining years.
export function nextClue(history, clues, clueById, start, now) {
  const range = currentRange(history, clueById, start, now);
  const asked = new Set(history.map((h) => h.id));
  const middle = (range.lo + range.hi) / 2;

  let best = null;
  for (const clue of clues) {
    if (asked.has(clue.id) || !isUseful(clue, range)) continue;
    if (!best || Math.abs(clue.year - middle) < Math.abs(best.year - middle)) {
      best = clue;
    }
  }
  return best;
}

// "What we know": every answered clue, newest first, with the position in the
// history so tapping a row can jump back to that question.
export function knownList(history, clueById) {
  const rows = [];
  history.forEach(({ id, choice }, index) => {
    if (choice === "skip") return;
    const answer = clueById[id][choice];
    rows.push({ index, clue: answer.clue, from: answer.from, to: answer.to });
  });
  return rows.reverse();
}

// ── Display text ───────────────────────────────────────────────────────────

// The headline range: "1971–1990", "1990", or "2022–Now".
export function formatRange({ lo, hi }, now) {
  const end = hi >= now ? "Now" : String(hi);
  return lo === hi ? String(lo) : `${lo}–${end}`;
}

// One answer's own years, for the right side of a "What we know" row:
// "1980–", "–1990" or "1949–1990".
export function formatAnswerYears(from, to) {
  return `${from ?? ""}–${to ?? ""}`;
}
