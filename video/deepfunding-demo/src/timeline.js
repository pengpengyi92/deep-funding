export const DURATION = 28;
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export const ramp = (t, a, b) => smooth((t - a) / (b - a));
export const windowAt = (t, a, b, fade = 0.4) =>
  ramp(t, a, a + fade) * (1 - ramp(t, b - fade, b));
export const lerp = (a, b, t) => a + (b - a) * t;
export const SHOTS = [
  {
    start: 0,
    end: 4,
    tag: "01 / THE CITY",
    kicker: "CAPITAL MEETS INFRASTRUCTURE",
    title: "Capital needs\nbetter infrastructure.",
    sub: "A future funding district, inspired by Shenzhen Qianhai.",
  },
  {
    start: 4,
    end: 8,
    tag: "02 / TWO SIDES, ONE NETWORK",
    kicker: "THE TWO-SIDED MARKETPLACE",
    title: "Every company.\nEvery capital provider. An Agent.",
    sub: "Two networks. One shared discovery layer.",
  },
  {
    start: 8,
    end: 12,
    tag: "03 / INSIDE THE COMPANY HUB",
    kicker: "INFORMATION  /  ANALYSIS  /  AUDIT",
    title: "A company, represented.",
    sub: "Founders, startups, SMEs and research teams.",
  },
  {
    start: 12,
    end: 17,
    tag: "04 / THE A2A JOURNEY",
    kicker: "BIDIRECTIONAL AGENT FLOW",
    title: "Profiles travel.\nOpportunity takes shape.",
    sub: "Structured needs meet structured funding mandates.",
  },
  {
    start: 17,
    end: 20,
    tag: "05 / DISCOVER THE NETWORK",
    kicker: "SEARCH THE NETWORK, NOT A CONTACT LIST",
    title: "One search. Many paths.",
    sub: "VC, PE, banks, angels and ecosystem programs.",
  },
  {
    start: 20,
    end: 24,
    tag: "06 / MATCH, THEN REVIEW",
    kicker: "EXPLAINABLE SHORTLIST",
    title: "The right conversation\nstarts with evidence.",
    sub: "Illustrative fit scores. Human review before introduction.",
  },
  {
    start: 24,
    end: 28,
    tag: "07 / AN AGENT-TO-AGENT CITY",
    kicker: "",
    title: "",
    sub: "",
  },
];
export function shotAt(t) {
  return SHOTS.find((s) => t >= s.start && t < s.end) ?? SHOTS.at(-1);
}
export function startupPosition(t) {
  const path = [
    { t: 0, p: [-11.6, 0.62, 1] },
    { t: 10, p: [-11.6, 0.62, 1] },
    { t: 12, p: [-10, 0.62, 4.8] },
    { t: 16.7, p: [9.2, 0.62, 4.8] },
    { t: 18, p: [10, 0.62, 1.4] },
    { t: 21.7, p: [10, 0.62, 1.4] },
    { t: 23, p: [11.4, 0.62, 0.8] },
    { t: 28, p: [11.4, 0.62, 0.8] },
  ];
  const i = path.findIndex(
    (p, j) => j < path.length - 1 && t >= p.t && t < path[j + 1].t,
  );
  if (i < 0) return [...path.at(-1).p];
  const u = ramp(t, path[i].t, path[i + 1].t);
  return path[i].p.map((v, k) => lerp(v, path[i + 1].p[k], u));
}
export function agentState(t) {
  if (t < 10) return "IDLE";
  if (t < 18) return "WALKING";
  if (t < 20) return "SEARCHING";
  if (t < 22) return "MATCHING";
  if (t < 24) return "TALKING";
  return "CONNECTED";
}
// The camera is a pure function of time: random-access rendering cannot change it.
export function cameraAt(t) {
  const keys = [
    [0, [-34, 29, 43], [0, 2, -3], 43],
    [4, [-27, 21, 35], [0, 3, -1], 43],
    [7.5, [-24, 17, 31], [0, 3, 0], 43],
    [9, [-23, 13, 22], [-10, 3, 0], 44],
    [11.5, [-21, 10, 19], [-10, 2.6, 1], 44],
    [13, [-13, 8, 19], [-6, 1.8, 3], 46],
    [16.5, [8, 9, 21], [5, 2, 2], 46],
    [18, [23, 14, 24], [10, 3, 0], 44],
    [20, [22, 12, 25], [10, 2.5, 0], 44],
    [23.4, [22, 13, 27], [9, 2.6, 0], 44],
    [26, [29, 24, 39], [0, 2.5, -2], 43],
    [28, [31, 25, 43], [0, 2.5, -2], 43],
  ];
  let j = keys.findIndex(
    (k, i) => i < keys.length - 1 && t >= k[0] && t < keys[i + 1][0],
  );
  if (j < 0) j = keys.length - 2;
  const [ta, pa, la, fa] = keys[j],
    [tb, pb, lb, fb] = keys[j + 1];
  const u = ramp(t, ta, tb);
  return {
    position: pa.map((v, i) => lerp(v, pb[i], u)),
    target: la.map((v, i) => lerp(v, lb[i], u)),
    fov: lerp(fa, fb, u),
  };
}
