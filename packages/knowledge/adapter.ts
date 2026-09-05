import {
  regions,
  sectors,
  stages,
  type Company,
  type Funder,
} from "../schemas";
import { legacyCategories, legacyStages, type PolicyId } from "./taxonomy";
import type { FundingProfile } from "./profile-schema";
import { stageOf } from "./readiness";

export function fundingProfileOf(f: Funder): FundingProfile {
  if (f.fundingProfile) return f.fundingProfile;
  if (
    f.ticketMinUsd === null ||
    f.ticketMaxUsd === null ||
    f.minimumMrrUsd === null
  )
    throw new Error("Incomplete legacy mandate");
  const category = legacyCategories[f.capitalType];
  const policy: PolicyId =
    category === "venture_capital"
      ? f.stages.every((s) => ["Growth", "Mature"].includes(s))
        ? "vc_growth"
        : f.stages.every((s) => s === "Pre-seed")
          ? "vc_pre_seed"
          : "vc_seed"
      : category === "private_equity"
        ? "private_equity"
        : category === "bank"
          ? "bank"
          : category === "incubator"
            ? "incubator"
            : category === "accelerator"
              ? "accelerator"
              : category === "angel"
                ? "angel"
                : category === "strategic_investor"
                  ? "strategic"
                  : "program";
  return {
    schema_version: "0.2.0",
    slug: "workspace-mandate",
    name: f.name,
    description: f.description,
    entity_type: "organization",
    categories: [category],
    policy_id: policy,
    target_stages: f.stages.map((s) => legacyStages[s]),
    provides_capital: true,
    capital_forms: null,
    provides: f.strategicResources,
    geographies: f.regions,
    industries: f.sectors,
    exclusions: f.excludedSectors,
    ticket_usd: { min: f.ticketMinUsd, max: f.ticketMaxUsd },
    company_requirements: {
      product: f.requiresProduct ? "required" : "not_required",
      technical_team: f.requiresTechnicalTeam ? "required" : "not_required",
      revenue: f.minimumMrrUsd > 0 ? "required" : "not_required",
      traction: "not_required",
      minimum_mrr_usd: f.minimumMrrUsd,
    },
    evidence_required: [],
    terms: null,
    application: { method: null, url: null, deadline: null },
    source_metadata: {
      status: "provided",
      verified_at: null,
      sources: [],
      notes:
        "Legacy workspace mandate. Category mapped from the old capitalType field. A cash ticket was explicitly provided; instruments and terms remain unknown.",
    },
  };
}
export function acceptsProvider(c: Company, p: FundingProfile) {
  if (c.acceptedCategories)
    return c.acceptedCategories.some((category) =>
      p.categories.includes(category),
    );
  return c.capitalTypes.some((t) => p.categories.includes(legacyCategories[t]));
}
export function acceptsStage(c: Company, p: FundingProfile) {
  const stage = stageOf(c);
  return (
    stage !== null &&
    p.target_stages !== null &&
    p.target_stages.includes(stage)
  );
}
// An imported catalogue profile is authoritative. Compatibility fields only let
// existing dashboards retain their shape; the matcher reads fundingProfile.
export function catalogueFunder(p: FundingProfile): Funder {
  const legacy =
    Object.entries(legacyCategories).find(([, category]) =>
      p.categories.includes(category),
    )?.[0] ?? "Policy fund";
  return {
    name: p.name,
    description: p.description,
    location: p.geographies?.join(" / ") || "Unknown",
    website: p.application.url || "",
    shareForMatching: true,
    privateNotes: "",
    evidence: [],
    capitalType: legacy as Funder["capitalType"],
    stages: stages.filter((s) => p.target_stages?.includes(legacyStages[s])),
    regions: regions.filter((r) => p.geographies?.includes(r)),
    sectors: sectors.filter((s) => p.industries?.includes(s)),
    excludedSectors: [],
    ticketMinUsd: p.ticket_usd?.min ?? null,
    ticketMaxUsd: p.ticket_usd?.max ?? null,
    minimumMrrUsd: p.company_requirements.minimum_mrr_usd,
    requiresProduct:
      p.company_requirements.product === "unknown"
        ? null
        : p.company_requirements.product === "required",
    requiresTechnicalTeam:
      p.company_requirements.technical_team === "unknown"
        ? null
        : p.company_requirements.technical_team === "required",
    strategicResources: p.provides,
    fundingProfile: p,
  };
}
