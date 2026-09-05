import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { BenchmarkEngine, quantile } from "../packages/benchmark/engine";
import {
  demoConfig,
  demoPortfolio,
  demoCandidate,
  demoFounder,
  demoProviders,
} from "../data/rsi-demo";
import { founderRSI } from "../packages/services/rsi";
const train = demoPortfolio.slice(0, 8),
  heldout = demoPortfolio.slice(8);
const baseline = BenchmarkEngine.fit(train, {
  ...demoConfig,
  features: demoConfig.features.map((f) => ({ ...f, weight: 20 })),
});
const changed = BenchmarkEngine.fit(train, demoConfig);
const results = heldout.map((r) => {
  const c = {
    id: r.id,
    name: r.name,
    sector: r.sector,
    stage: r.stage,
    snapshotDate: r.snapshotDate,
    features: r.features,
  };
  return {
    id: r.id,
    baseline: baseline.compare(c),
    changed: changed.compare(c),
  };
});
const times: number[] = [];
for (let i = 0; i < 1100; i++) {
  const t = performance.now();
  changed.compare(demoCandidate);
  if (i >= 100) times.push(performance.now() - t);
}
const output = {
  measuredAt: new Date().toISOString(),
  platform: process.platform,
  node: process.version,
  protocol:
    "Fixed synthetic entry-date split: first 8 train, last 4 held out. No candidate ID in training. Both use fixed bounds; baseline equal weights, change explicit user weights. No tuning against this holdout.",
  trainIds: train.map((r) => r.id),
  heldoutIds: heldout.map((r) => r.id),
  results,
  founder: founderRSI(demoFounder, demoProviders, demoConfig),
  timing: {
    samples: times.length,
    medianMs: quantile(times, 50),
    p95Ms: quantile(times, 95),
    scope: "Warm in-process compare only; excludes fit, I/O, network, browser",
  },
  modelCalls: 0,
  runtimeModelTokens: 0,
  developmentTokens: "UNMEASURED",
  result:
    "Pipeline and versioned diagnostic comparisons only; no predictive quality improvement established.",
  realFundingAccuracy: "UNMEASURED",
  investmentReturns: "UNMEASURED",
};
await writeFile(
  "docs/benchmarks/v0.2-rsi.json",
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    train: 8,
    heldout: 4,
    timing: output.timing,
    quality: output.realFundingAccuracy,
  }),
);
