import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { fundingCatalogue } from "../packages/knowledge/catalogue";
import { catalogueFunder } from "../packages/knowledge/adapter";
import { taxonomyCompanies } from "../data/taxonomy-demo";
import { evaluate, defaultWeights } from "../packages/matching";
import { ENGINE_VERSION } from "../packages/agents";
const now = new Date("2026-09-05T12:00:00Z");
const rows = taxonomyCompanies(now).flatMap((c) =>
  fundingCatalogue.map((k) => {
    const f = {
      id: k.slug,
      kind: "funder" as const,
      version: 1,
      updatedAt: now.toISOString(),
      data: catalogueFunder(k),
    };
    const m = evaluate(c, f, now).match;
    const ablation = evaluate(c, f, now, defaultWeights).match;
    return {
      company: c.id,
      entity: k.slug,
      policy: m.policyId,
      score: m.score,
      decision: m.decision,
      gaps: m.gaps,
      hardFailures: m.hardFailures,
      fixedSevenWeightAblation: {
        score: ablation.score,
        decision: ablation.decision,
      },
    };
  }),
);
const c = taxonomyCompanies(now)[1],
  k = fundingCatalogue[1];
const f = {
  id: k.slug,
  kind: "funder" as const,
  version: 1,
  updatedAt: now.toISOString(),
  data: catalogueFunder(k),
};
const durations: number[] = [];
for (let i = 0; i < 1000; i++) {
  const start = performance.now();
  evaluate(c, f, now);
  durations.push(performance.now() - start);
}
durations.sort((a, b) => a - b);
const result = {
  engineVersion: ENGINE_VERSION,
  measuredAt: new Date().toISOString(),
  fixtureDate: now.toISOString(),
  runtime: process.version,
  platform: process.platform,
  iterations: 1000,
  rows,
  latencyMs: { median: durations[500], p95: durations[950] },
  tokenUse: { modelCalls: 0, llmTokens: 0 },
  limits:
    "60 synthetic/partial-source policy cases. Seven-weight ablation keeps V0.2 gates and is NOT a full V0.1 rerun. Timing excludes D1/network/UI. Real-world precision, funding outcomes, underwriting validity and user utility: UNMEASURED.",
};
writeFileSync(
  "docs/benchmarks/v0.2-taxonomy.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { cases: rows.length, latencyMs: result.latencyMs, limits: result.limits },
    null,
    2,
  ),
);
