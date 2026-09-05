import { z } from "zod";
import { evaluate } from "../matching";
import { catalogueFunder } from "../knowledge/adapter";
import { fundingCatalogue as catalogue } from "../knowledge/catalogue";
import {
  BenchmarkEngine,
  similarity,
  selectCohort,
  fingerprint,
  RSI_VERSION,
} from "../benchmark/engine";
import {
  founderSchema,
  providerSchema,
  portfolioSchema,
  benchmarkConfigSchema,
  requirementKeys,
  type Founder,
  type Provider,
  type BenchmarkConfig,
  type PortfolioRecord,
} from "../benchmark/schemas";

export function providersFromCatalogue(): Provider[] {
  return catalogue.map((p) =>
    providerSchema.parse({
      id: p.slug,
      nameCn: null,
      nameEn: p.name,
      location: { city: "Unspecified", district: null },
      website: p.application.url,
      currency: "USD",
      fundingProfile: p,
      requirements: [],
      portfolio: [],
      lastVerifiedAt: null,
    }),
  );
}
export function searchProviders(
  providers: Provider[],
  filters: {
    query?: string;
    sector?: string;
    stage?: string;
    location?: string;
  },
) {
  const contains = (s: string, q?: string) =>
    !q || s.toLowerCase().includes(q.toLowerCase());
  return providers.filter(
    (p) =>
      contains(p.nameEn + " " + (p.nameCn ?? "") + " " + p.id, filters.query) &&
      (!filters.sector ||
        p.fundingProfile.industries?.some((s) =>
          contains(s, filters.sector),
        )) &&
      (!filters.stage ||
        p.fundingProfile.target_stages?.some((s) =>
          contains(s, filters.stage),
        )) &&
      contains(
        p.location.city + " " + (p.location.district ?? ""),
        filters.location,
      ),
  );
}
export function historySignal(
  founder: Founder,
  providerId: string,
  asOf: string,
) {
  const latest = new Map<string, Founder["fundingHistory"][number]>();
  for (const h of [...founder.fundingHistory].sort(
    (a, b) =>
      a.date.localeCompare(b.date, "en") || a.id.localeCompare(b.id, "en"),
  )) {
    if (h.providerId === providerId && h.date <= asOf)
      latest.set(h.opportunityId, h);
  }
  const events = [...latest.values()];
  const values = {
    contacted: 0,
    replied: 0.25,
    meeting: 0.5,
    dd: 0.65,
    term_sheet: 0.8,
    funded: 1,
    rejected: 0,
  };
  return {
    samples: events.length,
    eventIds: events.map((e) => e.id),
    value: events.length
      ? (1 + events.reduce((s, e) => s + values[e.result], 0)) /
        (events.length + 2)
      : null,
    explanation:
      "Latest event per opportunity at cutoff; stage signal with two pseudo-observations. Descriptive, not response probability.",
  };
}
export function founderRSI(
  input: unknown,
  providerInputs: unknown[],
  configInput: unknown,
) {
  const founder = founderSchema.parse(input),
    providers = providerInputs.map((p) => providerSchema.parse(p)),
    config = benchmarkConfigSchema.parse(configInput);
  if (new Set(providers.map((p) => p.id)).size !== providers.length)
    throw new Error("Duplicate provider ID");
  if (
    founder.benchmarkCandidate &&
    founder.benchmarkCandidate.snapshotDate > config.asOf
  )
    throw new Error("Founder snapshot is later than asOf");
  const now = new Date(config.asOf + "T12:00:00Z");
  const results = providers
    .map((p) => {
      const cp = {
        id: "local-founder",
        kind: "company" as const,
        version: 1,
        data: founder.company,
        updatedAt: now.toISOString(),
      };
      const fp = {
        id: p.id,
        kind: "funder" as const,
        version: 1,
        data: catalogueFunder(p.fundingProfile),
        updatedAt: now.toISOString(),
      };
      const { match } = evaluate(cp, fp, now);
      const history = historySignal(founder, p.id, config.asOf);
      const cohort = selectCohort(p.portfolio, {
        ...config,
        mode: "historical_median",
        providerId: p.id,
      });
      const comparisons = founder.benchmarkCandidate
        ? cohort
            .map((r) => similarity(founder.benchmarkCandidate!, r, config))
            .filter(
              (s) => s.coverage >= config.minCoverage && s.similarity !== null,
            )
        : [];
      const sim =
        comparisons.length >= config.minSamples
          ? comparisons.reduce((s, x) => s + x.similarity!, 0) /
            comparisons.length
          : null;
      const components = [
        {
          name: "mandate_fit",
          weight: 85,
          value: match.score / 100,
          points: 0.85 * match.score,
        },
        {
          name: "interaction_signal",
          weight: 10,
          value: history.value,
          points: 10 * (history.value ?? 0),
        },
        {
          name: "portfolio_similarity",
          weight: 5,
          value: sim,
          points: 5 * (sim ?? 0),
        },
      ];
      return {
        providerId: p.id,
        name: p.nameEn,
        policyId: p.fundingProfile.policy_id,
        score:
          Math.round(components.reduce((s, c) => s + c.points, 0) * 100) / 100,
        components,
        coverage:
          components
            .filter((c) => c.value !== null)
            .reduce((s, c) => s + c.weight, 0) / 100,
        decision: match.decision,
        recommendation:
          match.decision === "INTRODUCTION_READY"
            ? "HUMAN_REVIEW"
            : match.decision === "REJECTED"
              ? "DO_NOT_PRIORITIZE"
              : "RESOLVE_GAPS",
        hardFailures: match.hardFailures,
        gaps: match.gaps,
        mandateComponents: match.dimensions,
        history,
        portfolioSamples: comparisons.length,
        synthetic: p.fundingProfile.source_metadata.status === "synthetic",
        warnings: match.warnings,
        nextAction: match.nextAction,
      };
    })
    .sort(
      (a, b) =>
        Number(a.decision === "REJECTED") - Number(b.decision === "REJECTED") ||
        b.score - a.score ||
        a.providerId.localeCompare(b.providerId, "en"),
    );
  return {
    schemaVersion: "0.2.0",
    engineVersion: RSI_VERSION,
    asOf: config.asOf,
    version:
      RSI_VERSION + "-founder-" + fingerprint({ founder, providers, config }),
    results,
    warnings: [
      "Ranking is an internal heuristic, not a likelihood of funding; cross-policy scores are not calibrated.",
      "Unknown history or portfolio contributes zero without weight redistribution. Coverage must be reviewed.",
      "History can reproduce outreach and selection bias. Hard mandate failures cannot be overturned by historical similarity.",
      "No contacts, applications or investment actions are sent.",
    ],
  };
}
export function fundingRSI(
  portfolio: unknown,
  config: unknown,
  candidate: unknown,
) {
  return BenchmarkEngine.fit(portfolio, config).compare(candidate);
}
export function requirementReview(
  provider: Provider,
  supplied: Partial<
    Record<(typeof requirementKeys)[number], "provided" | "missing" | "unknown">
  >,
) {
  return requirementKeys.map((key) => {
    const override = provider.requirements.find((r) => r.key === key);
    return {
      key,
      expectation: override?.status ?? "unknown",
      source: override?.source ?? null,
      supplied: supplied[key] ?? "unknown",
      gap: override?.status === "required" && supplied[key] !== "provided",
      basis: override
        ? "provider_override"
        : "general_checklist_not_provider_claim",
    };
  });
}
export function parseProviders(text: string) {
  const input: unknown = text.trim().startsWith("[")
    ? JSON.parse(text)
    : text
        .split(/\r?\n/)
        .filter((l) => l.trim())
        .map((line, i) => {
          try {
            return JSON.parse(line);
          } catch {
            throw new Error("Invalid JSONL at line " + (i + 1));
          }
        });
  const parsed = z.array(providerSchema).max(5000).parse(input);
  if (new Set(parsed.map((p) => p.id)).size !== parsed.length)
    throw new Error("Duplicate provider ID");
  return parsed;
}
export function parseData(
  text: string,
):
  | { kind: "founder"; value: Founder }
  | { kind: "portfolio"; value: PortfolioRecord[] }
  | { kind: "providers"; value: Provider[] }
  | { kind: "config"; value: BenchmarkConfig } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { kind: "providers", value: parseProviders(text) };
  }
  if (Array.isArray(value)) {
    if (value.length && "entryDate" in (value[0] ?? {}))
      return { kind: "portfolio", value: portfolioSchema.parse(value) };
    return { kind: "providers", value: parseProviders(text) };
  }
  if (value && typeof value === "object" && "company" in value)
    return { kind: "founder", value: founderSchema.parse(value) };
  if (value && typeof value === "object" && "features" in value)
    return { kind: "config", value: benchmarkConfigSchema.parse(value) };
  throw new Error(
    "Expected founder, portfolio, provider array/JSONL, or benchmark config",
  );
}
