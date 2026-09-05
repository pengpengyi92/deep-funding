import { z } from "zod";
import {
  categories,
  companyStages,
  capitalForms,
  resourceTypes,
  policyIds,
  policyCategories,
} from "./taxonomy";

const httpUrl = z
  .url()
  .refine((s) => /^https?:\/\//.test(s), "HTTP(S) URL required");
const text = z.string().trim().min(1).max(500);
const requirement = z.enum([
  "required",
  "preferred",
  "not_required",
  "unknown",
]);
const unique = <T>(xs: T[]) => new Set(xs).size === xs.length;
// This structural schema is also exported as JSON Schema. Cross-field rules below
// remain mandatory in the runtime parser (JSON Schema alone is not sufficient).
export const fundingProfileShape = z
  .object({
    schema_version: z.literal("0.2.0"),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    name: text,
    description: z.string().trim().min(10).max(2000),
    entity_type: z.enum(["organization", "person", "program"]),
    categories: z.array(z.enum(categories)).min(1).max(categories.length),
    policy_id: z.enum(policyIds),
    target_stages: z
      .array(z.enum(companyStages))
      .max(companyStages.length)
      .nullable(),
    provides_capital: z.boolean().nullable(),
    capital_forms: z
      .array(z.enum(capitalForms))
      .max(capitalForms.length)
      .nullable(),
    provides: z.array(z.enum(resourceTypes)).max(resourceTypes.length),
    geographies: z.array(text).max(30).nullable(),
    industries: z.array(text).max(30).nullable(),
    exclusions: z.array(text).max(30).nullable(),
    ticket_usd: z
      .object({
        min: z.number().finite().min(0).max(1e12),
        max: z.number().finite().positive().max(1e12),
      })
      .strict()
      .nullable(),
    company_requirements: z
      .object({
        product: requirement,
        traction: requirement,
        revenue: requirement,
        technical_team: requirement,
        minimum_mrr_usd: z.number().finite().min(0).max(1e12).nullable(),
      })
      .strict(),
    evidence_required: z
      .array(z.enum(["team", "product", "traction", "financials"]))
      .max(4),
    terms: text.nullable(),
    application: z
      .object({
        method: text.nullable(),
        url: httpUrl.nullable(),
        deadline: z.iso.date().nullable(),
      })
      .strict(),
    source_metadata: z
      .object({
        status: z.enum(["scaffold", "provided", "synthetic"]),
        verified_at: z.null(),
        sources: z
          .array(
            z
              .object({
                url: httpUrl,
                accessed_at: z.iso.date(),
                claims: z.array(text).min(1).max(20),
              })
              .strict(),
          )
          .max(20),
        notes: z.string().max(2000),
      })
      .strict(),
  })
  .strict();
export const fundingProfileSchema = fundingProfileShape
  .refine((p) => unique(p.categories), {
    message: "Duplicate categories",
    path: ["categories"],
  })
  .refine(
    (p) => p.categories.some((c) => policyCategories[p.policy_id].includes(c)),
    {
      message: "Policy must belong to an explicit category",
      path: ["policy_id"],
    },
  )
  .refine(
    (p) =>
      !p.capital_forms?.some((f) =>
        ["loan", "credit_line", "venture_debt"].includes(f),
      ) || p.policy_id === "bank",
    {
      message:
        "Debt instruments require a credit policy; split distinct equity and debt offers",
      path: ["policy_id"],
    },
  )
  .refine((p) => !p.ticket_usd || p.ticket_usd.min <= p.ticket_usd.max, {
    message: "Reversed ticket",
    path: ["ticket_usd"],
  })
  .refine(
    (p) =>
      p.provides_capital !== false ||
      (p.ticket_usd === null &&
        (!p.capital_forms || p.capital_forms.length === 0)),
    {
      message:
        "Non-investing entity cannot claim capital instruments or a cash ticket",
      path: ["provides_capital"],
    },
  );
export type FundingProfile = z.infer<typeof fundingProfileSchema>;
