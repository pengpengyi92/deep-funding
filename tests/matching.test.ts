import { describe, it, expect } from "vitest";
import { demo } from "../data/demo";
import { evaluate, defaultWeights, compareMatches } from "../packages/matching";
import { companySchema, funderSchema } from "../packages/schemas";
import { usableEvidence } from "../packages/agents";
const now = new Date("2026-09-05T12:00:00Z");
function fixture() {
  const d = demo(now);
  return { c: d.companies[0], f: d.funders[0] };
}
describe("bilateral screening", () => {
  it("prioritizes review-ready decisions over equally high or higher unreviewable scores", () => {
    const d = demo(now);
    const rows = d.funders
      .map((f) => evaluate(d.companies[0], f, now).match)
      .reverse()
      .sort(compareMatches);
    expect(rows.slice(0, 2).map((m) => m.decision)).toEqual([
      "INTRODUCTION_READY",
      "INTRODUCTION_READY",
    ]);
    expect(rows[0].funderName).toBe("Meridian Seed Partners");
    expect(rows[2].decision).toBe("REQUEST_MORE_INFORMATION");
  });
  it("computes the synthetic result from seven weights, not the brief target", () => {
    const { c, f } = fixture();
    const { match, run } = evaluate(c, f, now);
    expect(match.score).toBe(96.67);
    expect(match.decision).toBe("INTRODUCTION_READY");
    expect(match.dimensions.reduce((a, b) => a + b.weight, 0)).toBe(100);
    expect(run.events.map((e) => e.from)).toEqual(
      expect.arrayContaining([
        "company.information",
        "company.analysis",
        "company.audit",
        "company.match",
        "funding.information",
        "funding.analysis",
        "funding.audit",
        "funding.match",
      ]),
    );
  });
  it.each([
    [
      "stage",
      (f: any) => {
        f.stages = ["Growth"];
      },
    ],
    [
      "geography",
      (f: any) => {
        f.regions = ["Europe"];
      },
    ],
    [
      "minimum ticket",
      (f: any) => {
        f.ticketMinUsd = 2000000;
      },
    ],
    [
      "maximum ticket",
      (f: any) => {
        f.ticketMaxUsd = 1000000;
      },
    ],
    [
      "excluded sector",
      (f: any) => {
        f.excludedSectors = ["AI"];
      },
    ],
    [
      "minimum MRR",
      (f: any) => {
        f.minimumMrrUsd = 25000;
      },
    ],
  ])("hard %s failure vetoes score", (_label, mutate) => {
    const { c, f } = fixture();
    mutate(f.data);
    const m = evaluate(c, f, now).match;
    expect(m.decision).toBe("REJECTED");
    expect(m.hardFailures.length).toBeGreaterThan(0);
  });
  it("company capital preference is independently binding", () => {
    const { c, f } = fixture();
    c.data.capitalTypes = ["Bank"];
    const m = evaluate(c, f, now).match;
    expect(m.score).toBeGreaterThan(90);
    expect(m.decision).toBe("REJECTED");
    expect(m.companyPerspective).toContain("does not accept");
  });
  it("product requirement and team requirement reject reported false", () => {
    const { c, f } = fixture();
    c.data.workingProduct = false;
    c.data.technicalTeam = false;
    expect(evaluate(c, f, now).match.hardFailures).toHaveLength(2);
  });
  it("unknown revenue is a gap, not a zero revenue rejection", () => {
    const { c, f } = fixture();
    c.data.mrrUsd = null;
    f.data.minimumMrrUsd = 10;
    const m = evaluate(c, f, now).match;
    expect(m.decision).toBe("REQUEST_MORE_INFORMATION");
    expect(m.hardFailures).toEqual([]);
  });
  it("unknown product and team fail closed", () => {
    const { c, f } = fixture();
    c.data.workingProduct = null;
    c.data.technicalTeam = null;
    expect(evaluate(c, f, now).match.decision).toBe("REQUEST_MORE_INFORMATION");
  });
  it("private notes never appear in a match or trace", () => {
    const { c, f } = fixture();
    c.data.privateNotes = "SECRET_123";
    f.data.privateNotes = "SECRET_456";
    expect(JSON.stringify(evaluate(c, f, now))).not.toContain("SECRET_");
  });
  it.each(["PRIVATE", "NDA_REQUIRED"] as const)(
    "%s evidence is not disclosed or scored",
    (visibility) => {
      const { c, f } = fixture();
      c.data.evidence[0].visibility = visibility;
      c.data.evidence[0].source = "SECRET_SOURCE";
      const r = evaluate(c, f, now);
      expect(JSON.stringify(r)).not.toContain("SECRET_SOURCE");
      expect(r.match.decision).toBe("REQUEST_MORE_INFORMATION");
    },
  );
  it.each(["2025-01-01", "2026-09-06"])(
    "stale/future %s evidence cannot pass audit",
    (date) => {
      const { c, f } = fixture();
      c.data.evidence[0].observedAt = date;
      expect(evaluate(c, f, now).match.decision).toBe(
        "REQUEST_MORE_INFORMATION",
      );
    },
  );
  it("source-free and unknown evidence are not usable", () => {
    const { c } = fixture();
    const e = c.data.evidence[0];
    expect(usableEvidence({ ...e, source: " " }, now)).toBe(false);
    expect(usableEvidence({ ...e, provenance: "UNKNOWN" }, now)).toBe(false);
  });
  it("zero customers with positive revenue is a reconciliation gap", () => {
    const { c, f } = fixture();
    c.data.customers = 0;
    const m = evaluate(c, f, now).match;
    expect(m.decision).toBe("REQUEST_MORE_INFORMATION");
    expect(m.gaps.join()).toContain("reconciliation");
  });
  it("neither side can match without consent", () => {
    const { c, f } = fixture();
    f.data.shareForMatching = false;
    expect(() => evaluate(c, f, now)).toThrow("consent");
    c.data.shareForMatching = false;
    f.data.shareForMatching = true;
    expect(() => evaluate(c, f, now)).toThrow("consent");
  });
  it("global mandate accepts a known region", () => {
    const { c, f } = fixture();
    f.data.regions = ["Global"];
    expect(evaluate(c, f, now).match.hardFailures).toEqual([]);
  });
  it("missing strategic needs do not earn free points", () => {
    const { c, f } = fixture();
    c.data.strategicNeeds = [];
    expect(
      evaluate(c, f, now).match.dimensions.find((d) => d.name === "Strategic")
        ?.points,
    ).toBe(0);
  });
  it("rejects malformed weights", () => {
    const { c, f } = fixture();
    expect(() =>
      evaluate(c, f, now, { ...defaultWeights, Stage: -25 }),
    ).toThrow();
    expect(() =>
      evaluate(c, f, now, { ...defaultWeights, Stage: NaN }),
    ).toThrow();
    expect(() =>
      evaluate(c, f, now, { ...defaultWeights, Stage: 30 }),
    ).toThrow();
  });
  it("is reproducible independent of generated trace IDs", () => {
    const { c, f } = fixture();
    const one = evaluate(c, f, now).match,
      two = evaluate(c, f, now).match;
    expect(one.dimensions).toEqual(two.dimensions);
    expect(one.score).toBe(two.score);
    expect(one.decision).toBe(two.decision);
  });
  it("emits only real gap events, sequential IDs and explicit protocol versions", () => {
    const { c, f } = fixture();
    f.data.evidence = [];
    const { run } = evaluate(c, f, now);
    expect(run.events.some((e) => e.type === "GAP_REQUEST")).toBe(true);
    expect(run.events.some((e) => e.type === "GAP_RESPONSE")).toBe(false);
    expect(run.events.map((e) => e.sequence)).toEqual(
      run.events.map((_, i) => i + 1),
    );
    expect(run.events.every((e) => e.protocolVersion === "1.0")).toBe(true);
    expect(new Set(run.events.map((e) => e.id)).size).toBe(run.events.length);
  });
  it("preserves input profiles and gives only provided provenance", () => {
    const { c, f } = fixture();
    const before = JSON.stringify({ c, f });
    const m = evaluate(c, f, now).match;
    expect(JSON.stringify({ c, f })).toBe(before);
    expect(m.evidenceSnapshot.every((e) => e.provenance === "PROVIDED")).toBe(
      true,
    );
  });
  it("all synthetic mandates exercise distinct outcomes", () => {
    const d = demo(now);
    expect(
      d.funders.map((f) => evaluate(d.companies[0], f, now).match.decision),
    ).toEqual([
      "INTRODUCTION_READY",
      "INTRODUCTION_READY",
      "REJECTED",
      "REJECTED",
      "REQUEST_MORE_INFORMATION",
    ]);
  });
});
describe("input contracts", () => {
  it("rejects cross-side evidence types and duplicate evidence IDs", () => {
    const { c, f } = fixture();
    expect(
      companySchema.safeParse({ ...c.data, evidence: f.data.evidence }).success,
    ).toBe(false);
    expect(
      funderSchema.safeParse({ ...f.data, evidence: c.data.evidence }).success,
    ).toBe(false);
    expect(
      companySchema.safeParse({
        ...c.data,
        evidence: [c.data.evidence[0], c.data.evidence[0]],
      }).success,
    ).toBe(false);
  });
  it("validates all fixtures", () => {
    const d = demo(now);
    d.companies.forEach((p) =>
      expect(companySchema.safeParse(p.data).success).toBe(true),
    );
    d.funders.forEach((p) =>
      expect(funderSchema.safeParse(p.data).success).toBe(true),
    );
  });
  it("rejects reversed tickets and contradictory sectors", () => {
    const { f } = fixture();
    expect(
      funderSchema.safeParse({ ...f.data, ticketMinUsd: 4000000 }).success,
    ).toBe(false);
    expect(
      funderSchema.safeParse({ ...f.data, excludedSectors: ["AI"] }).success,
    ).toBe(false);
  });
  it("rejects script URLs, non-finite values, unknown keys and forged verification", () => {
    const { c } = fixture();
    expect(
      companySchema.safeParse({ ...c.data, website: "javascript:alert(1)" })
        .success,
    ).toBe(false);
    expect(
      companySchema.safeParse({ ...c.data, mrrUsd: Infinity }).success,
    ).toBe(false);
    expect(companySchema.safeParse({ ...c.data, isAdmin: true }).success).toBe(
      false,
    );
    expect(
      companySchema.safeParse({
        ...c.data,
        evidence: [{ ...c.data.evidence[0], provenance: "VERIFIED" }],
      }).success,
    ).toBe(false);
  });
  it("bounds strings and evidence counts", () => {
    const { c } = fixture();
    expect(
      companySchema.safeParse({ ...c.data, name: "x".repeat(251) }).success,
    ).toBe(false);
    expect(
      companySchema.safeParse({
        ...c.data,
        evidence: Array(21).fill(c.data.evidence[0]),
      }).success,
    ).toBe(false);
  });
});
