// Date My Map: sounds, generated in the browser with Web Audio (no audio files).
//
// Browsers only allow sound after the user has tapped something, so the
// audio context is created on the first tap.

let ctx = null;

function audio() {
  if (!ctx) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    ctx = new Context();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// A short, dry tick, like an old mouse button.
export function playClick() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1800, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.02);
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.035);
}

// The win jingle for the result page: an 8-bit "level complete" run up a
// major chord (C, E, G, high C), with the last note held and wobbling.
export function playWin() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const step = 0.09;

  notes.forEach((freq, i) => {
    const start = t + i * step;
    const last = i === notes.length - 1;
    const length = last ? 0.45 : step * 0.9;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);
    if (last) {
      // A little vibrato on the held note.
      const wobble = ac.createOscillator();
      const depth = ac.createGain();
      wobble.frequency.value = 7;
      depth.gain.value = 9;
      wobble.connect(depth).connect(osc.frequency);
      wobble.start(start);
      wobble.stop(start + length);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.06, start + 0.01);
    gain.gain.setValueAtTime(0.06, start + length * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + length + 0.02);
  });
}

// A quick, bubbly pop for the pop-up notes.
export function playPop() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.06);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.13);
}
