import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { demo } from "../data/demo";
import { evaluate } from "../packages/matching";
import { ENGINE_VERSION } from "../packages/agents";
const now = new Date("2026-09-05T12:00:00Z");
const data = demo(now);
const expected = [
  "INTRODUCTION_READY",
  "INTRODUCTION_READY",
  "REJECTED",
  "REJECTED",
  "REQUEST_MORE_INFORMATION",
];
const rows = data.funders.map((f, i) => {
  const m = evaluate(data.companies[0], f, now).match;
  return {
    funder: f.data.name,
    score: m.score,
    expected: expected[i],
    actual: m.decision,
    scoreOnlyBaseline: m.score >= 75 ? "INTRODUCTION_READY" : "LOW_FIT",
    correct: m.decision === expected[i],
  };
});
const count = 1000;
const durations: number[] = [];
for (let i = 0; i < count; i++) {
  const start = performance.now();
  evaluate(data.companies[0], data.funders[i % data.funders.length], now);
  durations.push(performance.now() - start);
}
durations.sort((a, b) => a - b);
const report = {
  measuredAt: new Date().toISOString(),
  engineVersion: ENGINE_VERSION,
  runtime: process.version,
  platform: process.platform,
  fixtureDate: now.toISOString(),
  iterations: count,
  matchingMs: {
    median: durations[Math.floor(count * 0.5)],
    p95: durations[Math.floor(count * 0.95)],
  },
  rows,
  scoreOnlyFalseIntroductions: rows.filter(
    (r) =>
      r.scoreOnlyBaseline === "INTRODUCTION_READY" &&
      r.expected !== "INTRODUCTION_READY",
  ).length,
  engineFalseIntroductions: rows.filter(
    (r) =>
      r.actual === "INTRODUCTION_READY" && r.expected !== "INTRODUCTION_READY",
  ).length,
  tokenUse: { modelCalls: 0, llmTokens: 0 },
  limits:
    "Five synthetic mandate cases, not a real-world investment benchmark. Timing excludes D1, network and UI; includes random ID generation. No model is used.",
};
mkdirSync("docs/benchmarks", { recursive: true });
writeFileSync(
  "docs/benchmarks/v0.2-legacy-regression.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
