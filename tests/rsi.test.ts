import { describe, it, expect } from "vitest";
import {
  BenchmarkEngine,
  quantile,
  similarity,
} from "../packages/benchmark/engine";
import {
  benchmarkConfigSchema,
  portfolioSchema,
  cohortModes,
  founderSchema,
} from "../packages/benchmark/schemas";
import {
  founderRSI,
  historySignal,
  parseData,
  parseProviders,
  requirementReview,
} from "../packages/services/rsi";
import {
  demoConfig,
  demoPortfolio,
  demoCandidate,
  demoFounder,
  demoProviders,
} from "../data/rsi-demo";
import { fundingCatalogue } from "../packages/knowledge/catalogue";
import { catalogueFunder } from "../packages/knowledge/adapter";
import { funderSchema } from "../packages/schemas";

const build = (patch = {}) =>
  BenchmarkEngine.fit(demoPortfolio, { ...demoConfig, ...patch });
describe("RSI benchmark", () => {
  it("is deterministic and input-order independent", () => {
    expect(build().compare(demoCandidate)).toEqual(
      build().compare(demoCandidate),
    );
    expect(
      BenchmarkEngine.fit([...demoPortfolio].reverse(), demoConfig).version,
    ).toBe(build().version);
  });
  it("component points exactly explain the score", () => {
    const r = build().score(demoCandidate);
    expect(r.components.reduce((s, c) => s + c.points, 0)).toBeCloseTo(
      r.score!,
      6,
    );
    expect(r.coverage).toBe(1);
  });
  it("handles missing fields without redistributing weights", () => {
    const all = build().score(demoCandidate),
      r = build().score({
        ...demoCandidate,
        features: { ...demoCandidate.features, growth: null },
      });
    expect(r.coverage).toBe(0.75);
    expect(r.comparable).toBe(false);
    expect(r.score).toBeLessThan(all.score!);
    expect(
      build().compare({ ...demoCandidate, features: {} }).score,
    ).toBeNull();
    expect(
      build().compare({ ...demoCandidate, features: {} }).percentile,
    ).toBeNull();
  });
  it("percentile uses midrank ties and threshold uses interpolated quantile", () => {
    const equal = demoPortfolio.map((r) => ({
      ...r,
      features: demoCandidate.features,
    }));
    const result = BenchmarkEngine.fit(equal, {
      ...demoConfig,
      mode: "percentile",
    }).compare(demoCandidate);
    expect(result.percentile).toBe(50);
    expect(result.threshold).toBeCloseTo(result.score!, 6);
    expect(quantile([10, 20], 25)).toBe(12.5);
  });
  it.each(cohortModes)("supports %s", (mode) => {
    const result = build({
      mode,
      sector: "AI",
      stage: "seed",
      from: "2025-01-01",
      to: "2025-09-30",
      ids: demoPortfolio.slice(0, 4).map((r) => r.id),
    }).compare(demoCandidate);
    expect(result.mode).toBe(mode);
    expect(result.cohortSize).toBeGreaterThan(0);
  });
  it("custom and sector cohorts contain only explicit members", () => {
    expect(
      build({ mode: "custom_cohort", ids: [demoPortfolio[0].id] }).compare(
        demoCandidate,
      ).cohortIds,
    ).toEqual([demoPortfolio[0].id]);
    const r = build({ mode: "sector_specific", sector: "AI" }).compare(
      demoCandidate,
    );
    expect(
      r.cohortIds.every(
        (id) => demoPortfolio.find((p) => p.id === id)?.sector === "AI",
      ),
    ).toBe(true);
  });
  it("success cohorts exclude active, failed, future outcomes and insufficient multiples", () => {
    const records = structuredClone(demoPortfolio);
    records[0].outcome!.observedAt = "2027-01-01";
    records[3].outcome!.multiple = 1;
    const r = BenchmarkEngine.fit(records, {
      ...demoConfig,
      mode: "successful_portfolio_only",
    }).compare(demoCandidate);
    expect(r.cohortIds).toEqual(["synthetic-07", "synthetic-10"]);
    expect(r.status).toBe("INSUFFICIENT_DATA");
  });
  it("asOf prevents future entry leakage and future candidate evaluation", () => {
    expect(
      build({ asOf: "2025-06-30" }).compare({
        ...demoCandidate,
        snapshotDate: "2025-06-30",
      }).cohortSize,
    ).toBe(6);
    expect(() => build({ asOf: "2025-06-30" }).score(demoCandidate)).toThrow(
      /later/,
    );
    expect(() =>
      portfolioSchema.parse([
        { ...demoPortfolio[0], snapshotDate: "2026-01-01" },
      ]),
    ).toThrow();
  });
  it("leaves the candidate out of its own benchmark", () => {
    const r = demoPortfolio[0];
    const candidate = {
      id: r.id,
      name: r.name,
      sector: r.sector,
      stage: r.stage,
      snapshotDate: r.snapshotDate,
      features: r.features,
    };
    expect(build().compare(candidate).cohortIds).not.toContain(r.id);
  });
  it("validates ranges, weights, cohorts, provider IDs and temporal windows", () => {
    for (const patch of [
      { features: demoConfig.features.map((f) => ({ ...f, weight: 1 })) },
      { features: [{ ...demoConfig.features[0], weight: 100, max: 0 }] },
      { mode: "custom_cohort" },
      { mode: "sector_specific" },
      { mode: "time_window", from: "2026-02-01", to: "2026-01-01" },
      { to: "2027-01-01" },
    ])
      expect(
        benchmarkConfigSchema.safeParse({ ...demoConfig, ...patch }).success,
      ).toBe(false);
  });
  it("lower-is-better and clipping are explicit", () => {
    const e = build({
      features: [
        {
          key: "runway",
          label: "Test",
          unit: "months",
          weight: 100,
          min: 0,
          max: 24,
          direction: "lower",
        },
      ],
    });
    expect(e.score({ ...demoCandidate, features: { runway: 30 } }).score).toBe(
      0,
    );
    expect(e.score({ ...demoCandidate, features: { runway: -3 } }).score).toBe(
      100,
    );
  });
  it("similarity requires common coverage", () => {
    expect(
      similarity({ ...demoCandidate, features: {} }, demoCandidate, demoConfig)
        .similarity,
    ).toBeNull();
    expect(
      similarity(demoCandidate, demoCandidate, demoConfig).similarity,
    ).toBe(1);
  });
  it("append-only updates version the benchmark and reject duplicates", () => {
    const before = build(),
      next = before.update({ ...demoPortfolio[0], id: "new-record" });
    expect(next.version).not.toBe(before.version);
    expect(before.records).toHaveLength(12);
    expect(() => before.update(demoPortfolio[0])).toThrow(/Duplicate/);
    expect(() => {
      before.records[0].features.growth = 999;
    }).toThrow();
  });
  it("insufficient and zero matching cohort return no threshold", () => {
    const r = build({ providerId: "no-such-provider" }).compare(demoCandidate);
    expect(r.threshold).toBeNull();
    expect(r.delta).toBeNull();
    expect(r.status).toBe("INSUFFICIENT_DATA");
  });
  it("ranking rejects duplicate candidates and never ranks missing data first", () => {
    expect(() => build().rank([demoCandidate, demoCandidate])).toThrow(
      /Duplicate/,
    );
    expect(
      build().rank([
        { ...demoCandidate, id: "missing", features: {} },
        demoCandidate,
      ])[0].id,
    ).toBe(demoCandidate.id);
  });
});
describe("Founder RSI and taxonomy integration", () => {
  it("has explainable provider ranking without promising funding", () => {
    const a = founderRSI(demoFounder, demoProviders, demoConfig),
      b = founderRSI(demoFounder, demoProviders, demoConfig);
    expect(a).toEqual(b);
    expect(a.results).toHaveLength(3);
    a.results.forEach((r) =>
      expect(r.components.reduce((s, c) => s + c.points, 0)).toBeCloseTo(
        r.score,
        2,
      ),
    );
    expect(
      a.results.find((r) => r.providerId === "demo-credit")?.decision,
    ).toBe("REJECTED");
  });
  it("empty history stays unknown, not a zero success-rate claim", () => {
    const f = { ...demoFounder, fundingHistory: [] };
    expect(historySignal(f, "demo-frontier", demoConfig.asOf).value).toBeNull();
    expect(
      founderRSI(f, demoProviders, demoConfig).results.find(
        (r) => r.providerId === "demo-frontier",
      )?.history.samples,
    ).toBe(0);
  });
  it("deduplicates opportunity stages and excludes future feedback", () => {
    const base = demoFounder.fundingHistory[0];
    const f = {
      ...demoFounder,
      fundingHistory: [
        base,
        { ...base, id: "h2", date: "2026-09-02", result: "funded" as const },
        { ...base, id: "h3", date: "2027-01-01", result: "rejected" as const },
      ],
    };
    const signal = historySignal(f, "demo-frontier", demoConfig.asOf);
    expect(signal.samples).toBe(1);
    expect(signal.eventIds).toEqual(["h2"]);
    expect(signal.value).toBeCloseTo(2 / 3);
  });
  it("high history cannot override a mandate veto", () => {
    const f = {
      ...demoFounder,
      fundingHistory: [
        {
          ...demoFounder.fundingHistory[0],
          providerId: "demo-credit",
          result: "funded" as const,
        },
      ],
    };
    expect(
      founderRSI(f, demoProviders, demoConfig).results.find(
        (r) => r.providerId === "demo-credit",
      )?.recommendation,
    ).toBe("DO_NOT_PRIORITIZE");
  });
  it("rejects duplicates, wrong provider ownership and malformed JSONL", () => {
    expect(() =>
      founderSchema.parse({
        ...demoFounder,
        fundingHistory: [
          ...demoFounder.fundingHistory,
          ...demoFounder.fundingHistory,
        ],
      }),
    ).toThrow();
    expect(() =>
      parseProviders(JSON.stringify([demoProviders[0], demoProviders[0]])),
    ).toThrow(/Duplicate/);
    expect(() => parseProviders("{bad}\n")).toThrow(/line 1/);
    expect(() =>
      parseProviders(
        JSON.stringify([
          {
            ...demoProviders.find((p) => p.id === "demo-credit")!,
            portfolio: demoPortfolio,
          },
        ]),
      ),
    ).toThrow();
  });
  it("parses four dataset types and an intentionally empty Shenzhen registry", () => {
    for (const [kind, value] of [
      ["founder", demoFounder],
      ["portfolio", demoPortfolio],
      ["providers", demoProviders],
      ["config", demoConfig],
    ] as const)
      expect(parseData(JSON.stringify(value)).kind).toBe(kind);
    expect(parseProviders("\n")).toEqual([]);
  });
  it("provider requirements override general unknowns without invented facts", () => {
    const p = demoProviders[0],
      r = requirementReview(p, { team: "missing" });
    expect(r.find((r) => r.key === "team")?.gap).toBe(true);
    expect(r.find((r) => r.key === "legal")?.expectation).toBe("unknown");
  });
  it("unknown canonical tickets remain null in legacy API wrappers", () => {
    const p = fundingCatalogue.find((p) => p.slug === "y-combinator")!;
    const f = catalogueFunder(p);
    expect(f.ticketMaxUsd).toBeNull();
    expect(f.minimumMrrUsd).toBeNull();
    expect(f.sectors).toEqual([]);
    expect(f.stages).toEqual([]);
    expect(funderSchema.safeParse(f).success).toBe(true);
    expect(
      funderSchema.safeParse({ ...f, fundingProfile: undefined }).success,
    ).toBe(false);
  });
});
