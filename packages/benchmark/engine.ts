import {
  benchmarkConfigSchema,
  candidateSchema,
  portfolioSchema,
  portfolioRecordSchema,
  type Candidate,
  type PortfolioRecord,
  type BenchmarkConfig,
} from "./schemas";

export const RSI_VERSION = "rsi-rules-0.2.0";
function freeze(value: unknown): void {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}
const round = (x: number) => Math.round(x * 1e6) / 1e6;
export function quantile(values: number[], percentile: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = ((sorted.length - 1) * percentile) / 100;
  const low = Math.floor(position),
    high = Math.ceil(position);
  return round(sorted[low] + (sorted[high] - sorted[low]) * (position - low));
}
export function scoreCandidate(candidate: Candidate, config: BenchmarkConfig) {
  const components = config.features.map((f) => {
    const value = candidate.features[f.key] ?? null;
    const scaled =
      value === null
        ? null
        : Math.min(1, Math.max(0, (value - f.min) / (f.max - f.min)));
    const normalized =
      scaled === null ? null : f.direction === "higher" ? scaled : 1 - scaled;
    return {
      key: f.key,
      label: f.label,
      value,
      unit: f.unit,
      weight: f.weight,
      normalized,
      points: normalized === null ? 0 : normalized * f.weight,
      reason:
        normalized === null
          ? "Unknown: zero contribution; weight is not redistributed"
          : f.direction +
            " is favored within fixed bounds [" +
            f.min +
            ", " +
            f.max +
            "]",
    };
  });
  const coverage = round(
    components
      .filter((c) => c.value !== null)
      .reduce((s, c) => s + c.weight, 0) / 100,
  );
  return {
    id: candidate.id,
    name: candidate.name,
    score:
      coverage === 0
        ? null
        : round(components.reduce((s, c) => s + c.points, 0)),
    coverage,
    comparable: coverage >= config.minCoverage,
    components,
    missing: components
      .filter((c) => c.value === null && c.weight > 0)
      .map((c) => c.key),
  };
}
export function similarity(
  a: Candidate,
  b: Candidate,
  config: BenchmarkConfig,
) {
  const sa = scoreCandidate(a, config),
    sb = scoreCandidate(b, config);
  let distance = 0,
    weight = 0;
  for (let i = 0; i < sa.components.length; i++) {
    const x = sa.components[i],
      y = sb.components[i];
    if (x.normalized !== null && y.normalized !== null) {
      weight += x.weight;
      distance += x.weight * Math.abs(x.normalized - y.normalized);
    }
  }
  return {
    similarity: weight ? round(1 - distance / weight) : null,
    coverage: weight / 100,
  };
}
export function selectCohort(
  records: PortfolioRecord[],
  config: BenchmarkConfig,
) {
  return records
    .filter((r) => {
      if (r.entryDate > config.asOf || r.snapshotDate > config.asOf)
        return false;
      if (config.providerId && r.providerId !== config.providerId) return false;
      if (config.mode === "sector_specific" && r.sector !== config.sector)
        return false;
      if (config.mode === "stage_specific" && r.stage !== config.stage)
        return false;
      if (config.mode === "custom_cohort" && !config.ids.includes(r.id))
        return false;
      if (
        config.mode === "time_window" &&
        (r.entryDate < config.from! || r.entryDate > config.to!)
      )
        return false;
      if (config.mode === "successful_portfolio_only") {
        const o = r.outcome;
        return (
          !!o &&
          o.observedAt <= config.asOf &&
          o.status === "exit" &&
          o.multiple !== null &&
          o.multiple >= config.successMultiple
        );
      }
      return true;
    })
    .sort((a, b) => a.id.localeCompare(b.id, "en"));
}
// Reproducibility identifier, not a cryptographic integrity or security hash.
export function fingerprint(value: unknown): string {
  const stable = (v: unknown): string =>
    Array.isArray(v)
      ? "[" + v.map(stable).join(",") + "]"
      : v && typeof v === "object"
        ? "{" +
          Object.entries(v)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([k, x]) => JSON.stringify(k) + ":" + stable(x))
            .join(",") +
          "}"
        : JSON.stringify(v);
  let h = 2166136261;
  for (const c of stable(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}
export class BenchmarkEngine {
  readonly records: PortfolioRecord[];
  readonly config: BenchmarkConfig;
  readonly version: string;
  constructor(records: unknown, config: unknown) {
    this.records = portfolioSchema.parse(records);
    this.config = benchmarkConfigSchema.parse(config);
    freeze(this.records);
    freeze(this.config);
    this.version =
      RSI_VERSION +
      "-" +
      fingerprint({
        records: [...this.records].sort((a, b) =>
          a.id.localeCompare(b.id, "en"),
        ),
        config: this.config,
      });
  }
  static fit(records: unknown, config: unknown) {
    return new BenchmarkEngine(records, config);
  }
  score(value: unknown) {
    const c = candidateSchema.parse(value);
    if (c.snapshotDate > this.config.asOf)
      throw new Error("Candidate snapshot is later than benchmark asOf");
    return scoreCandidate(c, this.config);
  }
  rank(candidates: unknown[]) {
    const parsed = candidates.map((c) => candidateSchema.parse(c));
    if (new Set(parsed.map((c) => c.id)).size !== parsed.length)
      throw new Error("Duplicate candidate ID");
    return parsed
      .map((c) => this.score(c))
      .sort(
        (a, b) =>
          Number(b.comparable) - Number(a.comparable) ||
          (b.score ?? -1) - (a.score ?? -1) ||
          a.id.localeCompare(b.id, "en"),
      );
  }
  compare(value: unknown) {
    const candidate = candidateSchema.parse(value),
      scored = this.score(candidate);
    // Leave the candidate itself out; entry-time features only and outcomes cut off at asOf.
    const cohort = selectCohort(this.records, this.config).filter(
      (r) => r.id !== candidate.id,
    );
    const peers = cohort
      .map((r) => scoreCandidate(r, this.config))
      .filter((p) => p.comparable && p.score !== null);
    const values = peers.map((p) => p.score!);
    const enough =
      values.length >= this.config.minSamples &&
      scored.comparable &&
      scored.score !== null;
    const target =
      this.config.mode === "historical_average"
        ? values.length
          ? round(values.reduce((s, x) => s + x, 0) / values.length)
          : null
        : quantile(
            values,
            this.config.mode === "percentile" ? this.config.percentile : 50,
          );
    const percentile = enough
      ? round(
          (100 *
            (values.filter((v) => v < scored.score!).length +
              0.5 * values.filter((v) => v === scored.score).length)) /
            values.length,
        )
      : null;
    return {
      ...scored,
      benchmarkVersion: this.version,
      asOf: this.config.asOf,
      mode: this.config.mode,
      cohortSize: cohort.length,
      comparableSamples: peers.length,
      cohortIds: cohort.map((r) => r.id),
      threshold: enough ? target : null,
      percentile,
      delta: enough ? round(scored.score! - target!) : null,
      status: enough ? "COMPARABLE" : "INSUFFICIENT_DATA",
      neighbors: cohort
        .map((r) => ({
          id: r.id,
          name: r.name,
          ...similarity(candidate, r, this.config),
        }))
        .filter((r) => r.coverage >= this.config.minCoverage)
        .sort(
          (a, b) =>
            (b.similarity ?? -1) - (a.similarity ?? -1) ||
            a.id.localeCompare(b.id, "en"),
        )
        .slice(0, 5),
      strengths: scored.components
        .filter((c) => c.normalized !== null && c.normalized >= 0.75)
        .map((c) => c.key),
      weaknesses: scored.components
        .filter((c) => c.normalized !== null && c.normalized < 0.4)
        .map((c) => c.key),
      warnings: [
        "Descriptive cohort comparison, not a funding probability or investment decision.",
        "Historical portfolio is selected, not a representative opportunity set; selection and survivorship bias remain.",
        ...(enough
          ? []
          : [
              "Too few comparable observations or insufficient feature coverage.",
            ]),
        ...(this.config.mode === "successful_portfolio_only"
          ? ["Success-only selection increases survivorship bias."]
          : []),
        ...(new Set(cohort.map((r) => r.providerId)).size > 1
          ? [
              "Multiple providers pooled; select providerId for an institution-specific benchmark.",
            ]
          : []),
        ...(cohort.some((r) => r.provenance === "synthetic")
          ? ["Cohort contains synthetic records."]
          : []),
      ],
    };
  }
  explain(value: unknown) {
    return this.compare(value);
  }
  update(record: unknown) {
    const parsed = portfolioRecordSchema.parse(record);
    if (this.records.some((r) => r.id === parsed.id))
      throw new Error(
        "Duplicate ID: updates append new observations, never silently overwrite",
      );
    return new BenchmarkEngine([...this.records, parsed], this.config);
  }
  export() {
    return {
      schemaVersion: "0.2.0",
      engineVersion: RSI_VERSION,
      version: this.version,
      config: this.config,
      records: this.records,
    };
  }
}
