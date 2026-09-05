# [RSI] Add a company-group temporal holdout evaluator

## Context
V0.2 includes a fixed 8/4 synthetic split, not an independently labelled prediction benchmark. Multiple observations of one company require grouped evaluation before model comparisons.

## Scope
Introduce a split utility that separates by stable company identity and time, records excluded outcomes unavailable at cutoff, and emits a reproducible split manifest. Use synthetic data only.

## Non-goals
No new predictive model, private dataset, score tuning, claims of improved funding probability or automatic decision-making.

## Acceptance Criteria
- A company never appears in both training and evaluation.
- Future outcome labels cannot leak into fit/calibration.
- Split output includes cutoffs, IDs, counts and exclusions.
- Empty/too-small cohort fails visibly.

## Tests and Files
packages/benchmark, tests/rsi.test.ts, scripts/rsi-benchmark.ts. Add repeated-company and future-outcome adversarial tests; npm run check.
