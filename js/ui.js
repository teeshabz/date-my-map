// Date My Map: small helpers shared by every screen.

// Builds an element: h("p", { class: "fact" }, "text", childElement).
// Attributes starting with "on" become event listeners.
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value);
  }
  el.append(...children);
  return el;
}

// An element whose inside is an SVG string (the pixel maps).
export function svgBox(className, svg) {
  const el = h("div", { class: className });
  el.innerHTML = svg;
  return el;
}

export function mascot(className) {
  return h("img", { class: className, src: "assets/mascot.svg", alt: "" });
}

// The ↗ arrow, drawn as a tiny SVG. The text character "↗" shows up as a
// colour emoji on iPhones, so it's drawn instead, in the text's own colour.
function arrowIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "arrow");
  svg.setAttribute("viewBox", "0 0 10 10");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<path d="M2 8 L8 2 M3.5 2 H8 V6.5" fill="none" stroke="currentColor" stroke-width="1.5" />';
  return svg;
}

// "learn more ↗": opens a Wikipedia article in a new tab, so the session
// isn't lost.
export function learnMore(wiki, className = "learn-more") {
  return h(
    "a",
    { class: className, href: `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki)}`, target: "_blank", rel: "noopener" },
    "learn more ",
    arrowIcon(),
  );
}

// The text link to the timeline (welcome and result screens).
export function timelineLink(text) {
  return h("a", { class: "text-link", href: "#timeline" }, text);
}
