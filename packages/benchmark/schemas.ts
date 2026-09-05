import { z } from "zod";
import { companySchema } from "../schemas";
import { fundingProfileSchema } from "../knowledge/profile-schema";

const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/);
const label = z.string().trim().min(1).max(250);
const featureKey = z.string().regex(/^[a-z][a-z0-9_]{0,59}$/);
export const featureValues = z.record(
  featureKey,
  z.number().finite().min(-1e12).max(1e12).nullable(),
);
export const candidateSchema = z
  .object({
    id,
    name: label,
    sector: label,
    stage: label,
    snapshotDate: z.iso.date(),
    features: featureValues,
  })
  .strict();
export const portfolioRecordSchema = candidateSchema
  .extend({
    entryDate: z.iso.date(),
    providerId: id,
    source: label,
    provenance: z.enum(["synthetic", "private"]),
    outcome: z
      .object({
        status: z.enum(["active", "exit", "failed", "written_off"]),
        observedAt: z.iso.date(),
        multiple: z.number().finite().nonnegative().max(10000).nullable(),
        irr: z.number().finite().min(-1).max(1000).nullable(),
      })
      .strict()
      .nullable(),
  })
  .refine(
    (r) => r.snapshotDate <= r.entryDate,
    "Entry features must be known at entry, not reconstructed from later results",
  )
  .refine(
    (r) => !r.outcome || r.outcome.observedAt >= r.entryDate,
    "Outcome cannot precede entry",
  );
export const portfolioSchema = z
  .array(portfolioRecordSchema)
  .min(1)
  .max(5000)
  .refine(
    (rs) => new Set(rs.map((r) => r.id)).size === rs.length,
    "Duplicate portfolio ID",
  );
export const cohortModes = [
  "historical_average",
  "historical_median",
  "percentile",
  "successful_portfolio_only",
  "sector_specific",
  "stage_specific",
  "time_window",
  "custom_cohort",
] as const;
export const benchmarkConfigSchema = z
  .object({
    asOf: z.iso.date(),
    mode: z.enum(cohortModes),
    sector: label.nullable(),
    stage: label.nullable(),
    from: z.iso.date().nullable(),
    to: z.iso.date().nullable(),
    ids: z.array(id).max(5000),
    providerId: id.nullable(),
    percentile: z.number().finite().min(0).max(100),
    minSamples: z.number().int().min(2).max(5000),
    minCoverage: z.number().finite().min(0.1).max(1),
    successMultiple: z.number().finite().min(1).max(10000),
    features: z
      .array(
        z
          .object({
            key: featureKey,
            label,
            unit: label,
            weight: z.number().finite().min(0).max(100),
            min: z.number().finite().min(-1e12).max(1e12),
            max: z.number().finite().min(-1e12).max(1e12),
            direction: z.enum(["higher", "lower"]),
          })
          .strict()
          .refine(
            (f) => f.max > f.min,
            "Feature range must have positive width",
          ),
      )
      .min(1)
      .max(50),
  })
  .strict()
  .superRefine((c, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (Math.abs(c.features.reduce((sum, f) => sum + f.weight, 0) - 100) > 1e-8)
      fail("Weights must total 100");
    if (new Set(c.features.map((f) => f.key)).size !== c.features.length)
      fail("Duplicate feature key");
    if (c.mode === "sector_specific" && !c.sector)
      fail("sector_specific requires sector");
    if (c.mode === "stage_specific" && !c.stage)
      fail("stage_specific requires stage");
    if (c.mode === "custom_cohort" && !c.ids.length)
      fail("custom_cohort requires IDs");
    if (c.mode === "time_window" && (!c.from || !c.to))
      fail("time_window requires from and to");
    if (c.from && c.to && c.from > c.to) fail("Reversed time window");
    if (c.to && c.to > c.asOf) fail("Window cannot extend beyond asOf");
  });
export const founderSchema = z
  .object({
    schemaVersion: z.literal("0.2.0"),
    company: companySchema,
    background: z.array(label).max(30),
    priorStartups: z.array(label).max(30),
    domainExperience: z.array(label).max(30),
    education: z.array(label).max(30),
    benchmarkCandidate: candidateSchema.nullable(),
    fundingHistory: z
      .array(
        z
          .object({
            id,
            providerId: id,
            opportunityId: id,
            date: z.iso.date(),
            result: z.enum([
              "contacted",
              "replied",
              "meeting",
              "dd",
              "term_sheet",
              "funded",
              "rejected",
            ]),
            amountUsd: z.number().finite().nonnegative().max(1e12).nullable(),
            source: label,
            notes: z.string().max(2000),
          })
          .strict(),
      )
      .max(5000),
  })
  .strict()
  .refine(
    (f) =>
      new Set(f.fundingHistory.map((h) => h.id)).size ===
      f.fundingHistory.length,
    "Duplicate history event ID",
  );
export const requirementKeys = [
  "problem",
  "solution",
  "product",
  "market",
  "business_model",
  "traction",
  "competition",
  "moat",
  "team",
  "financials",
  "funding_ask",
  "use_of_funds",
  "revenue_assumptions",
  "cost_structure",
  "cash_flow",
  "runway",
  "unit_economics",
  "scenario_analysis",
  "funding_requirement",
  "cap_table",
  "entity_structure",
  "existing_investors",
  "debt",
  "option_pool",
  "ip_ownership",
  "proposed_transaction",
  "legal",
  "finance",
  "tax",
  "technology",
  "commercial",
  "founder",
  "compliance",
] as const;
export const requirementSchema = z
  .object({
    key: z.enum(requirementKeys),
    status: z.enum(["required", "preferred", "not_required", "unknown"]),
    source: label.nullable(),
  })
  .strict()
  .refine(
    (r) => r.status === "unknown" || r.source !== null,
    "Specific requirements need a source",
  );
export const providerSchema = z
  .object({
    id,
    nameCn: label.nullable(),
    nameEn: label,
    location: z.object({ city: label, district: label.nullable() }).strict(),
    website: z
      .url()
      .refine((s) => /^https?:\/\//.test(s))
      .nullable(),
    currency: z.enum(["USD", "CNY", "HKD"]),
    fundingProfile: fundingProfileSchema,
    requirements: z.array(requirementSchema).max(requirementKeys.length),
    portfolio: z.array(portfolioRecordSchema).max(5000),
    lastVerifiedAt: z.iso.date().nullable(),
  })
  .strict()
  .refine(
    (p) => p.id === p.fundingProfile.slug,
    "Provider ID must match canonical slug",
  )
  .refine(
    (p) => p.portfolio.every((r) => r.providerId === p.id),
    "Portfolio ownership mismatch",
  )
  .refine(
    (p) => new Set(p.portfolio.map((r) => r.id)).size === p.portfolio.length,
    "Duplicate portfolio ID",
  )
  .refine(
    (p) =>
      new Set(p.requirements.map((r) => r.key)).size === p.requirements.length,
    "Duplicate requirement",
  )
  .refine(
    (p) =>
      p.fundingProfile.source_metadata.status !== "synthetic" ||
      p.lastVerifiedAt === null,
    "Synthetic data cannot be verified",
  );
export type Candidate = z.infer<typeof candidateSchema>;
export type PortfolioRecord = z.infer<typeof portfolioRecordSchema>;
export type BenchmarkConfig = z.infer<typeof benchmarkConfigSchema>;
export type Founder = z.infer<typeof founderSchema>;
export type Provider = z.infer<typeof providerSchema>;
