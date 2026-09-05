import { z } from "zod";

export const stages = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Growth",
  "Mature",
] as const;
export const regions = [
  "Greater China",
  "Singapore",
  "Europe",
  "North America",
  "Global",
] as const;
export const sectors = [
  "AI",
  "SaaS",
  "Fintech",
  "Healthcare",
  "Climate",
  "Consumer",
  "Industrial",
] as const;
export const capitalTypes = [
  "Angel",
  "VC",
  "PE",
  "Bank",
  "Incubator",
  "Accelerator",
  "Industrial fund",
  "Policy fund",
  "Strategic investor",
  "Family office",
] as const;
export const resources = [
  "Enterprise distribution",
  "Technical expertise",
  "Recruiting",
  "Overseas expansion",
  "Manufacturing",
  "Regulatory support",
] as const;
export const visibility = [
  "PUBLIC",
  "MATCH_ONLY",
  "PRIVATE",
  "NDA_REQUIRED",
] as const;
const text = z.string().trim().min(1).max(250);
const money = z.number().finite().min(0).max(1e12);
export const evidenceSchema = z
  .object({
    id: z.string().min(1).max(80),
    field: z.enum(["product", "traction", "team", "mandate"]),
    label: text,
    source: z.string().trim().max(500),
    provenance: z.enum(["PROVIDED", "UNKNOWN"]),
    visibility: z.enum(visibility),
    observedAt: z.iso.date(),
  })
  .strict();
const base = {
  name: text,
  description: z.string().trim().min(10).max(2000),
  location: text,
  website: z.union([
    z.literal(""),
    z.url().refine((s) => /^https?:\/\//.test(s), "HTTP(S) URL required"),
  ]),
  shareForMatching: z.boolean(),
  privateNotes: z.string().max(3000).default(""),
  evidence: z.array(evidenceSchema).max(20),
};
export const companySchema = z
  .object({
    ...base,
    stage: z.enum(stages),
    region: z.enum(regions),
    sector: z.enum(sectors),
    raiseUsd: money.positive(),
    capitalTypes: z.array(z.enum(capitalTypes)).min(1).max(10),
    mrrUsd: money.nullable(),
    customers: z.number().int().min(0).max(1e9).nullable(),
    teamSize: z.number().int().min(1).max(1e6),
    technicalTeam: z.boolean().nullable(),
    workingProduct: z.boolean().nullable(),
    useOfFunds: z.string().trim().min(5).max(1000),
    strategicNeeds: z.array(z.enum(resources)).max(6),
  })
  .strict()
  .refine((p) => p.evidence.every((e) => e.field !== "mandate"), {
    message: "Company evidence must describe product, traction or team",
    path: ["evidence"],
  })
  .refine(
    (p) => new Set(p.evidence.map((e) => e.id)).size === p.evidence.length,
    { message: "Evidence IDs must be unique", path: ["evidence"] },
  );
export const funderSchema = z
  .object({
    ...base,
    capitalType: z.enum(capitalTypes),
    stages: z.array(z.enum(stages)).min(1).max(5),
    regions: z.array(z.enum(regions)).min(1).max(5),
    sectors: z.array(z.enum(sectors)).min(1).max(7),
    excludedSectors: z.array(z.enum(sectors)).max(7),
    ticketMinUsd: money,
    ticketMaxUsd: money.positive(),
    minimumMrrUsd: money,
    requiresProduct: z.boolean(),
    requiresTechnicalTeam: z.boolean(),
    strategicResources: z.array(z.enum(resources)).max(6),
  })
  .strict()
  .refine((p) => p.evidence.every((e) => e.field === "mandate"), {
    message: "Funding evidence must describe the mandate",
    path: ["evidence"],
  })
  .refine(
    (p) => new Set(p.evidence.map((e) => e.id)).size === p.evidence.length,
    { message: "Evidence IDs must be unique", path: ["evidence"] },
  )
  .refine((x) => x.ticketMinUsd <= x.ticketMaxUsd, {
    message: "Minimum ticket must not exceed maximum ticket",
    path: ["ticketMinUsd"],
  })
  .refine((x) => !x.sectors.some((s) => x.excludedSectors.includes(s)), {
    message: "A sector cannot be both preferred and excluded",
    path: ["excludedSectors"],
  });

export type Company = z.infer<typeof companySchema>;
export type Funder = z.infer<typeof funderSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Profile<T> = {
  id: string;
  kind: "company" | "funder";
  version: number;
  data: T;
  updatedAt: string;
};
export type Audit = {
  status: "REVIEWABLE" | "GAPS";
  warnings: string[];
  gaps: string[];
  evidence: { id: string; provenance: string; usable: boolean }[];
};
export type Analysis = {
  summary: string;
  strengths: string[];
  risks: string[];
  nextActions: string[];
};
export type MessageType =
  | "PROFILE_READY"
  | "ANALYSIS_READY"
  | "AUDIT_READY"
  | "MATCH_REQUEST"
  | "MATCH_RESPONSE"
  | "GAP_REQUEST"
  | "GAP_RESPONSE"
  | "MATCH_DECISION"
  | "HUMAN_HANDOFF";
export type TraceEvent = {
  id: string;
  protocolVersion: "1.0";
  sequence: number;
  timestamp: string;
  from: string;
  to: string;
  type: MessageType;
  summary: string;
  evidenceRefs: string[];
  payload: Record<string, unknown>;
};
export type Run = {
  id: string;
  createdAt: string;
  engineVersion: string;
  execution: "deterministic";
  events: TraceEvent[];
};
export type Dimension = {
  name: string;
  weight: number;
  value: number;
  points: number;
  reason: string;
  evidenceRefs: string[];
};
export type Match = {
  id: string;
  companyId: string;
  funderId: string;
  companyName: string;
  funderName: string;
  companyVersion: number;
  funderVersion: number;
  createdAt: string;
  runId: string;
  score: number;
  decision:
    "INTRODUCTION_READY" | "REQUEST_MORE_INFORMATION" | "REJECTED" | "LOW_FIT";
  hardFailures: string[];
  gaps: string[];
  warnings: string[];
  dimensions: Dimension[];
  companyAnalysis: Analysis;
  funderAnalysis: Analysis;
  companyAudit: Audit;
  funderAudit: Audit;
  companyPerspective: string;
  funderPerspective: string;
  nextAction: string;
  evidenceSnapshot: Evidence[];
  engineVersion: string;
};
export type Handoff = {
  id: string;
  kind: "information" | "introduction" | "response";
  matchId: string;
  createdAt: string;
  status: "RECORDED_NOT_SENT";
  note: string;
};
export const noteSchema = z
  .object({ note: z.string().trim().min(3).max(2000) })
  .strict();
