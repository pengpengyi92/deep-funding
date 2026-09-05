import type { Company } from "../schemas";
import { legacyStages, type Category, type CompanyStage } from "./taxonomy";
import { usableEvidence } from "./evidence";

export function stageOf(c: Company): CompanyStage | null {
  return c.companyStage === undefined
    ? (legacyStages[c.stage] ?? null)
    : c.companyStage;
}
export function fundingReadiness(c: Company, now = new Date()) {
  const stage = stageOf(c);
  const has = (field: string) =>
    c.evidence.some((e) => e.field === field && usableEvidence(e, now));
  const components = [
    {
      name: "Team evidence",
      weight: 25,
      met: has("team"),
      next: "Document founder roles and relevant execution evidence.",
    },
    {
      name: "Working product evidence",
      weight: 25,
      met: c.workingProduct === true && has("product"),
      next: "Link a working prototype or reproducible product demonstration.",
    },
    {
      name: "Customer validation evidence",
      weight: 20,
      met: c.customers !== null && c.customers > 0 && has("traction"),
      next: "Collect dated customer or design-partner validation; do not imply paid revenue.",
    },
    {
      name: "Revenue disclosure evidence",
      weight: 15,
      met: c.mrrUsd !== null && has("traction"),
      next: "Document revenue, including an explicitly confirmed zero.",
    },
    {
      name: "Use of resources",
      weight: 15,
      met:
        c.useOfFunds.trim().length >= 5 &&
        (c.raiseUsd > 0 || c.strategicNeeds.length > 0),
      next: "Connect the cash/resource request to a measurable next milestone.",
    },
  ].map((x) => ({ ...x, points: x.met ? x.weight : 0 }));
  const early =
    stage !== null &&
    ["idea", "pre_company", "prototype", "pre_seed"].includes(stage);
  const mature =
    stage !== null && ["growth", "mature", "buyout_ready"].includes(stage);
  const recommended: Category[] =
    stage === null
      ? []
      : early
        ? [
            "incubator",
            "accelerator",
            "angel",
            "venture_capital",
            "grant",
            "university_fund",
          ]
        : mature
          ? ["venture_capital", "private_equity", "strategic_investor", "bank"]
          : ["venture_capital", "accelerator", "strategic_investor"];
  return {
    company_stage: stage,
    stage_basis:
      c.companyStage === undefined
        ? "Legacy stage label mapped for compatibility; financing history is not inferred."
        : "User-declared stage; not independently verified.",
    financing_round: c.financingRound ?? null,
    funding_readiness_score: components.reduce((s, x) => s + x.points, 0),
    interpretation:
      "Evidence-readiness heuristic, not funding probability, eligibility, company quality or investment advice. No fixed progression between categories.",
    components,
    recommended_categories: recommended.map((category) => ({
      category,
      reason: early
        ? "Early-stage capital or company-building resources; verify each program's actual eligibility."
        : "Discovery candidate only; verify current mandate and underwriting.",
    })),
    not_recommended_now: early
      ? [
          "Growth/buyout PE and ordinary cash-flow bank debt need financial evidence not implied by a hackathon MVP. Special programs and venture debt require separate review.",
        ]
      : [],
    missing_evidence: [
      ...components.filter((x) => !x.met).map((x) => x.name),
      ...(stage === null ? ["Company stage is unknown."] : []),
    ],
    next_milestones: components.filter((x) => !x.met).map((x) => x.next),
  };
}
export type Readiness = ReturnType<typeof fundingReadiness>;
