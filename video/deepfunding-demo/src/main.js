import "./style.css";
import { createWorld } from "./world.js";
import {
  DURATION,
  FPS,
  clamp,
  ramp,
  windowAt,
  shotAt,
  agentState,
} from "./timeline.js";

const $ = (id) => document.getElementById(id);
const renderMode = new URLSearchParams(location.search).has("render");
if (renderMode) document.body.classList.add("render");
const world = createWorld($("world"));
let time = 0,
  playing = !renderMode,
  last = performance.now(),
  state;
function resize() {
  const w = $("film").clientWidth,
    h = (w * 9) / 16;
  world.resize(w, h);
  $("titles").style.transform = `scale(${w / 1920})`;
}
function opacity(id, n) {
  $(id).style.opacity = String(clamp(n));
}
function seek(t) {
  time = clamp(t, 0, DURATION);
  state = world.update(time);
  const s = shotAt(time);
  $("shot-label").textContent = s.tag;
  $("kicker").textContent = s.kicker;
  $("headline").textContent = s.title;
  $("subline").textContent = s.sub;
  const show =
    s.start === 0
      ? ramp(time, 0, 0.6) * (1 - ramp(time, 3.6, 4))
      : windowAt(time, s.start, s.end, 0.35);
  opacity("narrative", show);
  opacity("profile", windowAt(time, 12.2, 17.1, 0.35));
  opacity("matches", windowAt(time, 20, 24.15, 0.35));
  opacity("dialogue", windowAt(time, 21.7, 24, 0.3));
  opacity("ending", ramp(time, 25, 25.7));
  opacity("fade", 1 - ramp(time, 0, 0.5) + ramp(time, 27.55, 28));
  $("progress").style.width = `${(time / DURATION) * 1920}px`;
  $("timecode").textContent =
    `00:${String(Math.floor(time)).padStart(2, "0")} / 00:28`;
  $("disclaimer").textContent =
    time >= 17 && time < 24
      ? "ILLUSTRATIVE SCORES / NO OUTREACH OR TRANSACTION"
      : "PRODUCT CONCEPT / SYNTHETIC AGENTS";
  $("scrub").value = String(time);
  $("preview-time").textContent = `${time.toFixed(1)} / 28.0s`;
  return { ...state, time, shot: s.tag, state: agentState(time) };
}
function toggle() {
  playing = !playing;
  $("play").innerHTML = playing ? "&#x23F8;" : "&#x25B6;";
  $("play").title = playing ? "Pause" : "Play";
  $("play").setAttribute("aria-label", playing ? "Pause" : "Play");
  last = performance.now();
}
$("play").onclick = toggle;
$("restart").onclick = () => seek(0);
$("scrub").oninput = (e) => {
  playing = false;
  seek(Number(e.target.value));
  $("play").innerHTML = "&#x25B6;";
  $("play").title = "Play";
  $("play").setAttribute("aria-label", "Play");
};
window.addEventListener("resize", () => {
  resize();
  seek(time);
});
resize();
seek(0);
function animate(now) {
  if (playing) {
    const dt = Math.min((now - last) / 1000, 0.1);
    seek((time + dt) % DURATION);
  }
  last = now;
  requestAnimationFrame(animate);
}
if (!renderMode) requestAnimationFrame(animate);
// A deterministic frame API used by both verification and the MP4 exporter.
window.film = {
  seek,
  frame: (i) => seek(i / FPS),
  getState: () => ({ ...state, time, state: agentState(time) }),
  duration: DURATION,
  fps: FPS,
  ready: true,
};
