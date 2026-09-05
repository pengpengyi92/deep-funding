import { taxonomyCompanies } from "./taxonomy-demo";
import { fundingCatalogue } from "../packages/knowledge/catalogue";
import {
  benchmarkConfigSchema,
  candidateSchema,
  founderSchema,
  portfolioSchema,
  providerSchema,
} from "../packages/benchmark/schemas";

export const demoConfig = benchmarkConfigSchema.parse({
  asOf: "2026-09-05",
  mode: "historical_median",
  sector: null,
  stage: null,
  from: null,
  to: null,
  ids: [],
  providerId: "demo-frontier",
  percentile: 75,
  minSamples: 3,
  minCoverage: 0.8,
  successMultiple: 2,
  features: [
    {
      key: "revenue_usd",
      label: "Annual revenue",
      unit: "USD/year",
      weight: 20,
      min: 0,
      max: 1000000,
      direction: "higher",
    },
    {
      key: "growth",
      label: "Revenue growth",
      unit: "fraction/year",
      weight: 25,
      min: -0.5,
      max: 2,
      direction: "higher",
    },
    {
      key: "runway",
      label: "Cash runway",
      unit: "months",
      weight: 20,
      min: 0,
      max: 24,
      direction: "higher",
    },
    {
      key: "customers",
      label: "Paying customers",
      unit: "count",
      weight: 15,
      min: 0,
      max: 100,
      direction: "higher",
    },
    {
      key: "technical_experience",
      label: "Domain engineering experience",
      unit: "years",
      weight: 20,
      min: 0,
      max: 10,
      direction: "higher",
    },
  ],
});
// Explicit synthetic distributions; they do not model a real investor or measured returns.
export const demoPortfolio = portfolioSchema.parse(
  Array.from({ length: 12 }, (_, i) => ({
    id: "synthetic-" + String(i + 1).padStart(2, "0"),
    name: "Fictional Company " + (i + 1),
    providerId: "demo-frontier",
    sector: i % 3 === 0 ? "Industrial" : "AI",
    stage: i % 2 === 0 ? "seed" : "pre_seed",
    snapshotDate: "2025-" + String(i + 1).padStart(2, "0") + "-01",
    entryDate: "2025-" + String(i + 1).padStart(2, "0") + "-15",
    source: "Synthetic v0.2 regression fixture",
    provenance: "synthetic",
    features: {
      revenue_usd: 50000 + i * 65000,
      growth: i === 2 ? null : 0.1 + i * 0.1,
      runway: 7 + i,
      customers: 5 + i * 6,
      technical_experience: 2 + i * 0.5,
    },
    outcome: {
      status: i % 3 === 0 ? "exit" : i % 3 === 1 ? "failed" : "active",
      observedAt: "2026-08-01",
      multiple: i % 3 === 0 ? 2.5 : null,
      irr: null,
    },
  })),
);
export const demoCandidate = candidateSchema.parse({
  id: "synthetic-candidate",
  name: "Fictional Agent Startup",
  sector: "AI",
  stage: "seed",
  snapshotDate: "2026-08-15",
  features: {
    revenue_usd: 620000,
    growth: 1.1,
    runway: 18,
    customers: 62,
    technical_experience: 8,
  },
});
export const demoFounder = founderSchema.parse({
  schemaVersion: "0.2.0",
  company: taxonomyCompanies(new Date("2026-09-05T12:00:00Z"))[1].data,
  background: ["Synthetic technical founder"],
  priorStartups: [],
  domainExperience: ["AI infrastructure"],
  education: [],
  benchmarkCandidate: {
    ...demoCandidate,
    features: {
      revenue_usd: 0,
      growth: null,
      runway: 12,
      customers: 0,
      technical_experience: 4,
    },
  },
  fundingHistory: [
    {
      id: "history-1",
      opportunityId: "round-one",
      providerId: "demo-frontier",
      date: "2026-09-01",
      result: "meeting",
      amountUsd: null,
      source: "Synthetic interaction",
      notes: "Not a real contact",
    },
  ],
});
export const demoProviders = fundingCatalogue
  .filter((p) =>
    ["demo-frontier", "demo-launchpad", "demo-credit"].includes(p.slug),
  )
  .map((p) =>
    providerSchema.parse({
      id: p.slug,
      nameCn: null,
      nameEn: p.name,
      location: { city: "Shenzhen", district: null },
      website: null,
      currency: "USD",
      fundingProfile: p,
      requirements: [
        { key: "team", status: "required", source: "Synthetic mandate only" },
      ],
      portfolio: p.slug === "demo-frontier" ? demoPortfolio : [],
      lastVerifiedAt: null,
    }),
  );
