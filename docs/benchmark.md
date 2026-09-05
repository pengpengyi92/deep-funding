# RSI Benchmark Protocol

RSI means Recursive Selection Intelligence, not a financial momentum indicator. V0.2 is a deterministic research baseline, not a learned prediction model. `packages/benchmark` owns schema, cohort selection, scoring, similarity, rank, comparison, explanation and append-only updates. `packages/services/rsi.ts` is shared by GUI, CLI and TUI. Python in the brief was an example; this release keeps the existing TypeScript stack to avoid a second, divergent scoring implementation.

## Feature Contract

Each feature declares key, unit, lower/upper bound, direction and nonnegative weight. Weights total 100. Values are normalized to fixed bounds and clipped to [0,1]. Missing values contribute zero; their weights are NOT redistributed. All missing means null score. Coverage reports observed feature weight. Below configured coverage, percentile and threshold comparison are withheld. Fixed bounds are user policy, not evidence of quality; low/high clipping can hide extreme values and must be reviewed.

Education/background are stored as optional founder context, not used as proxy quality features. The synthetic engineering-experience feature is a configurable demonstration, not an institutional hiring/investment rule. Avoid protected traits and review proxy bias before adding features.

## Cohorts and Time

Modes: historical_average, historical_median, percentile, successful_portfolio_only, sector_specific, stage_specific, time_window, custom_cohort. Provider ID independently filters institution. Candidate ID is left out. Entry features must predate/equal entry; entries after `asOf` are excluded. Success-only requires an exited observation, a known multiple above the configured cutoff, and outcome known by `asOf`. Active positions are not assumed successes. Candidate snapshots after cutoff are rejected.

Threshold is the arithmetic mean for historical_average, configured interpolated quantile for percentile, median for other modes. Empirical percentile = 100 * (strictly lower peer scores + half tied peer scores) / comparable peer count. It is not the probability of success. Small samples below `minSamples` withhold comparison. Multiple institutions, selected portfolios and success-only filters carry explicit bias warnings.

Similarity is one minus weighted normalized L1 distance on common observed features. No common features means unknown. Neighbor lists require minimum common coverage. No embedding model, black-box ranking or automated threshold tuning is included.

## Recursive Updates

`BenchmarkEngine.fit(records, config)` creates an immutable snapshot. `score`, `rank`, `compare`, `explain` consume it. `update(record)` appends a unique observation and returns a new version; existing snapshots do not mutate. CLI `rsi funding update` persists the new data and rebuilds. Replacing a config/dataset makes a saved export stale until rebuilt.

Version = engine ID plus canonicalized input/config FNV-1a fingerprint. This is a reproducibility convenience, **not a cryptographic signature**. Keep exported snapshots for audit. A future correction/event model must distinguish the same company's repeated observations and retain revisions; do not create duplicate pseudo-companies to inflate a cohort.

## Baseline and Experiment

Falsifiable question: can all three interfaces return identical explanations while rejecting temporal leakage, missing-data inflation and mandate-veto overrides? Fixed synthetic tests assert these properties. `npm run benchmark:rsi` uses eight historical training records and four later held-out records; baseline equal feature weights versus explicit demo weights. No tuning against holdout, no predictive superiority claim. Raw results include cohort membership, weights, components, timing, zero runtime LLM calls, and UNMEASURED real funding accuracy/development-token consumption.

Future models must beat a preregistered baseline on a licensed temporal AND company-group-separated dataset, with consent, outcome availability, rejection/non-response denominators, calibration, coverage, fairness, latency, cost and human-review metrics. Historical portfolio similarity alone cannot establish causation or investment returns.
