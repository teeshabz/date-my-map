// Date My Map: the "map changes" timeline. Every clue is one event, oldest
// first, grouped by decade. Same data as the questions.
//
// One set of markup serves both layouts; the CSS switches between them.
//   Phone:   a line down the left, year left of it, card right of it.
//   Desktop: a sidebar with "Jump to" decade buttons; the line runs down the
//            centre and cards alternate sides.

import { clues } from "../data/clues.js";
import { h, svgBox, learnMore } from "./ui.js";
import { pixelMapSvg } from "./pixelmap.js";

const JUMP_DECADES = [1800, 1850, 1900, 1920, 1940, 1960, 1980, 2000, 2020];

const decadeOf = (year) => Math.floor(year / 10) * 10;

function byDecade() {
  const groups = new Map();
  for (const clue of [...clues].sort((a, b) => a.year - b.year)) {
    const decade = decadeOf(clue.year);
    if (!groups.has(decade)) groups.set(decade, []);
    groups.get(decade).push(clue);
  }
  return groups;
}

function card(clue) {
  return h(
    "article",
    { class: "tl-card sunken" },
    h(
      "div",
      { class: "tl-card-head" },
      svgBox("tl-minimap", pixelMapSvg({ land: "#C8C8C8", dot: clue.place })),
      h("h3", { class: "tl-title" }, clue.title),
    ),
    h("p", { class: "tl-blurb" }, clue.fact),
    learnMore(clue.wiki),
  );
}

// Scroll the timeline to the first decade at or after `decade`.
function jumpTo(decade) {
  const headers = [...document.querySelectorAll(".tl-decade")];
  const target = headers.find((el) => Number(el.dataset.decade) >= decade) ?? headers.at(-1);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function timelineScreen(homeButton) {
  let side = 0; // desktop: alternate cards left and right across the whole list
  const decades = [...byDecade()].map(([decade, events]) =>
    h(
      "section",
      { class: "tl-group" },
      h("h2", { class: "tl-decade", "data-decade": decade, id: `decade-${decade}` }, h("span", {}, `${decade}s`)),
      h(
        "ol",
        { class: "tl-events" },
        ...events.map((clue) =>
          h(
            "li",
            { class: `tl-event ${side++ % 2 ? "tl-right" : "tl-left"}` },
            h("span", { class: "tl-year" }, String(clue.year)),
            h("span", { class: "tl-marker", "aria-hidden": "true" }),
            card(clue),
          ),
        ),
      ),
    ),
  );

  return h(
    "div",
    { class: "tl-page" },
    h(
      "aside",
      { class: "tl-sidebar" },
      homeButton,
      h("h1", { class: "tl-heading" }, "map changes"),
      h("p", { class: "tl-sub" }, "a scroll through geographic shifts :)"),
      h(
        "nav",
        { class: "tl-jump", "aria-label": "Jump to a decade" },
        h("p", { class: "tl-jump-label" }, "Jump to"),
        h(
          "div",
          { class: "tl-jump-grid" },
          ...JUMP_DECADES.map((d) => h("button", { class: "raised", onclick: () => jumpTo(d) }, `${d}s`)),
        ),
      ),
    ),
    h("div", { class: "tl-main" }, ...decades),
  );
}
