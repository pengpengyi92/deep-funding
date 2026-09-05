import { z } from "zod";
import rawPolicies from "../../funding/00_taxonomy/matching_policies.json";
import { policyIds, type PolicyId } from "./taxonomy";
export const dimensionNames = [
  "Stage",
  "Sector",
  "Ticket",
  "Geography",
  "Traction",
  "Team",
  "Strategic",
  "Product",
  "Financials",
  "Repayment",
] as const;
export type PolicyDimension = (typeof dimensionNames)[number];
const policySchema = z
  .object({
    weights: z.partialRecord(
      z.enum(dimensionNames),
      z.number().min(0).max(100),
    ),
    evidence: z.array(z.enum(["team", "product", "traction", "financials"])),
    financialGate: z.boolean(),
  })
  .strict()
  .refine(
    (p) =>
      Math.abs(
        Object.values(p.weights).reduce((n, v) => n + (v ?? 0), 0) - 100,
      ) < 1e-8,
    "Weights must sum to 100",
  );
export const policies = z
  .record(z.enum(policyIds), policySchema)
  .parse(rawPolicies);
export const policyFor = (id: PolicyId) => policies[id];
