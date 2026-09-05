import { describe, it, expect } from "vitest";
import { fundingCatalogue } from "../packages/knowledge/catalogue";
import { fundingProfileSchema } from "../packages/knowledge/profile-schema";
import { companySchema, type Profile, type Funder } from "../packages/schemas";
import {
  categoryGroups,
  companyStages,
  categories,
} from "../packages/knowledge/taxonomy";
import { policies } from "../packages/knowledge/policies";
import { fundingReadiness, stageOf } from "../packages/knowledge/readiness";
import { catalogueFunder } from "../packages/knowledge/adapter";
import { evaluate, matchIsStale } from "../packages/matching";
import { taxonomyCompanies } from "../data/taxonomy-demo";
const now = new Date("2026-09-05T12:00:00Z");
function funder(slug: string): Profile<Funder> {
  const p = structuredClone(fundingCatalogue.find((p) => p.slug === slug)!);
  return {
    id: slug,
    kind: "funder",
    version: 1,
    updatedAt: now.toISOString(),
    data: catalogueFunder(p),
  };
}
describe("capital and resource taxonomy", () => {
  it("old engine decisions become stale without rewriting historical results", () => {
    const m = evaluate(
      taxonomyCompanies(now)[1],
      funder("demo-launchpad"),
      now,
    ).match;
    expect(matchIsStale(m, 1, 1, now)).toBe(false);
    expect(
      matchIsStale({ ...m, engineVersion: "rules-1.0.0" }, 1, 1, now),
    ).toBe(true);
    expect(matchIsStale(m, 2, 1, now)).toBe(true);
  });
  it("validates every canonical profile and exposes all categories in nine groups", () => {
    fundingCatalogue.forEach((p) =>
      expect(fundingProfileSchema.safeParse(p).success).toBe(true),
    );
    expect(categoryGroups).toHaveLength(9);
    expect(new Set(categoryGroups.flatMap((g) => g.categories))).toEqual(
      new Set(categories),
    );
    expect(new Set(fundingCatalogue.map((p) => p.slug)).size).toBe(
      fundingCatalogue.length,
    );
  });
  it("one YC entity belongs to both accelerator and VC, without duplicate identity", () => {
    const yc = fundingCatalogue.find((p) => p.slug === "y-combinator")!;
    expect(yc.categories).toEqual(["accelerator", "venture_capital"]);
    expect(yc.policy_id).toBe("accelerator");
    expect(yc.ticket_usd).toBeNull();
    expect(yc.terms).toBeNull();
    expect(yc.source_metadata.verified_at).toBeNull();
  });
  it.each(companyStages)(
    "accepts normalized %s independently of financing round",
    (stage) => {
      const c = taxonomyCompanies(now)[0].data;
      const parsed = companySchema.parse({
        ...c,
        companyStage: stage,
        financingRound: "none",
      });
      expect(stageOf(parsed)).toBe(stage);
      expect(parsed.financingRound).toBe("none");
    },
  );
  it("does not invent a financing round for a bootstrapped mature company", () => {
    const r = fundingReadiness(taxonomyCompanies(now)[3].data, now);
    expect(r.company_stage).toBe("mature");
    expect(r.financing_round).toBe("none");
  });
  it("explicitly unknown stage does not fall back to a known legacy label", () => {
    const c = taxonomyCompanies(now)[1].data;
    c.companyStage = null;
    const r = fundingReadiness(c, now);
    expect(r.company_stage).toBeNull();
    expect(r.recommended_categories).toEqual([]);
  });
  it("recommends discovery categories with evidence-based, non-probabilistic readiness", () => {
    const r = fundingReadiness(taxonomyCompanies(now)[1].data, now);
    expect(r.recommended_categories.map((c) => c.category)).toEqual(
      expect.arrayContaining(["accelerator", "angel", "grant"]),
    );
    expect(r.funding_readiness_score).toBe(
      r.components.reduce((n, c) => n + c.points, 0),
    );
    expect(r.interpretation).toContain("not funding probability");
  });
  it("ignores private or stale readiness evidence", () => {
    const c = taxonomyCompanies(now)[1].data;
    c.evidence.forEach((e) => (e.visibility = "PRIVATE"));
    expect(fundingReadiness(c, now).funding_readiness_score).toBe(15);
  });
  it.each(Object.keys(policies))("validates %s policy weights", (id) => {
    const p = policies[id as keyof typeof policies];
    expect(Object.values(p.weights).reduce((n, v) => n + (v || 0), 0)).toBe(
      100,
    );
  });
  it("idea founder can match a non-investing incubator without product or revenue", () => {
    const c = taxonomyCompanies(now)[0];
    const m = evaluate(c, funder("demo-workshop"), now).match;
    expect(m.hardFailures).toEqual([]);
    expect(m.gaps).toEqual([]);
    expect(m.decision).toBe("INTRODUCTION_READY");
    expect(m.dimensions.some((d) => d.name === "Ticket")).toBe(false);
  });
  it("non-investing incubator cannot satisfy a cash request", () => {
    const m = evaluate(
      taxonomyCompanies(now)[1],
      funder("demo-workshop"),
      now,
    ).match;
    expect(m.decision).toBe("REJECTED");
    expect(m.hardFailures.join()).toContain("resources only");
  });
  it("empty or contradictory resource-only request fails schema", () => {
    const c = taxonomyCompanies(now)[0].data;
    expect(companySchema.safeParse({ ...c, strategicNeeds: [] }).success).toBe(
      false,
    );
    expect(companySchema.safeParse({ ...c, raiseUsd: 2000 }).success).toBe(
      false,
    );
  });
  it("same company has different explainable outcomes for accelerator, PE and bank", () => {
    const c = taxonomyCompanies(now)[1];
    const rows = ["demo-launchpad", "demo-pe", "demo-credit"].map(
      (s) => evaluate(c, funder(s), now).match,
    );
    expect(rows[0].hardFailures).toEqual([]);
    expect(rows[1].decision).toBe("REJECTED");
    expect(rows[2].decision).toBe("REJECTED");
    expect(new Set(rows.map((m) => m.score)).size).toBeGreaterThan(1);
    rows.forEach((m) =>
      expect(m.dimensions.every((d) => d.reason.length > 10)).toBe(true),
    );
  });
  it("unknown financial facts cannot authorize bank or PE even when maturity fits", () => {
    const c = taxonomyCompanies(now)[3];
    delete c.data.financials;
    for (const id of ["demo-credit", "demo-pe"]) {
      const m = evaluate(c, funder(id), now).match;
      expect(m.gaps.join()).toContain("Financial statements");
      expect(m.decision).not.toBe("INTRODUCTION_READY");
    }
  });
  it("mature borrower with annual financials is not required to invent SaaS MRR", () => {
    const c = taxonomyCompanies(now)[3];
    c.data.mrrUsd = null;
    const m = evaluate(c, funder("demo-credit"), now).match;
    expect(m.decision).toBe("INTRODUCTION_READY");
    expect(m.gaps).toEqual([]);
    c.data.mrrUsd = 0;
    const explicit = funder("demo-credit");
    explicit.data.fundingProfile!.company_requirements.minimum_mrr_usd = 1000;
    expect(evaluate(c, explicit, now).match.hardFailures.join()).toContain(
      "Monthly revenue is below",
    );
  });
  it("bank repayment does not pass negative cash flow or debt service shortfall", () => {
    const c = taxonomyCompanies(now)[3];
    c.data.financials!.operatingCashFlowUsd = -1;
    expect(evaluate(c, funder("demo-credit"), now).match.decision).toBe(
      "REJECTED",
    );
    c.data.financials!.operatingCashFlowUsd = 100;
    expect(evaluate(c, funder("demo-credit"), now).match.decision).toBe(
      "REQUEST_MORE_INFORMATION",
    );
  });
  it("unknown YC mandate stays unreviewable and produces actual gap trace", () => {
    const { match, run } = evaluate(
      taxonomyCompanies(now)[1],
      funder("y-combinator"),
      now,
    );
    expect(match.decision).toBe("REQUEST_MORE_INFORMATION");
    expect(match.gaps.join()).toContain("scaffold");
    expect(run.events.some((e) => e.type === "GAP_REQUEST")).toBe(true);
    expect(match.funderAnalysis.strengths.join()).toContain("unknown");
  });
  it("stale or future catalogue mandate evidence fails closed", () => {
    for (const date of ["2025-01-01", "2027-01-01"]) {
      const f = funder("demo-launchpad");
      f.data.fundingProfile!.source_metadata.sources[0].accessed_at = date;
      expect(evaluate(taxonomyCompanies(now)[1], f, now).match.decision).toBe(
        "REQUEST_MORE_INFORMATION",
      );
    }
  });
  it("multi-category policy is explicit, not whichever score is highest", () => {
    const f = funder("demo-launchpad");
    expect(evaluate(taxonomyCompanies(now)[1], f, now).match.policyId).toBe(
      "accelerator",
    );
  });
  it("rejects policy-category mismatch, duplicate categories and debt gate bypass", () => {
    const p = funder("demo-credit").data.fundingProfile!;
    expect(
      fundingProfileSchema.safeParse({ ...p, policy_id: "angel" }).success,
    ).toBe(false);
    expect(
      fundingProfileSchema.safeParse({ ...p, categories: ["bank", "bank"] })
        .success,
    ).toBe(false);
    expect(
      fundingProfileSchema.safeParse({
        ...p,
        categories: ["bank", "accelerator"],
        policy_id: "accelerator",
      }).success,
    ).toBe(false);
  });
  it("rejects non-investing cash tickets and script URLs", () => {
    const p = funder("demo-workshop").data.fundingProfile!;
    expect(
      fundingProfileSchema.safeParse({
        ...p,
        source_metadata: { ...p.source_metadata, verified_at: "2026-09-05" },
      }).success,
    ).toBe(false);
    expect(
      fundingProfileSchema.safeParse({ ...p, ticket_usd: { min: 0, max: 1 } })
        .success,
    ).toBe(false);
    expect(
      fundingProfileSchema.safeParse({
        ...p,
        application: { ...p.application, url: "javascript:alert(1)" },
      }).success,
    ).toBe(false);
  });
  it("category tags and resource duplicates do not inflate a score", () => {
    const c = taxonomyCompanies(now)[1];
    const f = funder("demo-launchpad");
    const before = evaluate(c, f, now).match.score;
    c.data.strategicNeeds = [
      ...c.data.strategicNeeds,
      ...c.data.strategicNeeds,
    ];
    expect(evaluate(c, f, now).match.score).toBe(before);
  });
});
