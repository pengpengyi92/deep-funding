# Benchmark Card: Deep Funding

## RSI V0.2 Baseline -> Change -> Measure -> Result -> Trade-off -> Next Action

**Baseline:** Fixed normalization bounds, equal feature weights, eight synthetic historical entries. **Change:** Explicit user-configured feature weights, missing-data coverage, cohort selection, immutable snapshots and mandate-gated Founder RSI. Falsifiable question: do GUI/CLI/TUI preserve the same scores and veto/temporal rules without data upload?

**Measure:** Four later synthetic entries held out from fit; no tuning against them. Both baseline and change retain entry-time features and the same missing-value policy. 100 warm-up + 1,000 timed comparisons, excluding fit/I/O/network/UI. Raw [v0.2-rsi.json](docs/benchmarks/v0.2-rsi.json).

**Result:** 113 local unit/CLI/TUI tests pass. Median compare 0.02145 ms, p95 0.051975 ms on Windows/Node 24.18.0. Runtime LLM calls/tokens = 0; development token usage = UNMEASURED. Score differences are diagnostic, **not demonstrated predictive improvement**. Browser parity/privacy tests are a separate gate.

**Trade-off:** Policy weights and feature bounds are subjective; selected historical portfolios are biased; missing fields reduce scores; small samples cannot support outcome probabilities. No model training or automatic threshold tuning occurs.

**Next Action:** Licensed, preregistered temporal AND company-group holdout with measured calibration, decision quality and human-review cost. Real fundraising accuracy, conversion and economic benefit remain UNMEASURED.

## V0.2 Baseline -> Change -> Measure -> Result -> Trade-off -> Next Action

**Baseline:** V0.1 five-case artifact remains unchanged. A separate seven-weight ablation on the new fixtures keeps V0.2 gates, so it is not a full V0.1 engine replay.

**Change:** Ten provider-specific policies, scoped evidence requirements, separate company stage/financing history, resources-only matching and financial/repayment gates. Hypothesis: explicit policies can distinguish an idea-stage resource request from ordinary cash-flow debt without weakening consent or evidence boundaries.

**Measure:** Four fictional company profiles x 15 catalogue entries = 60 pairs, fixed 2026-09-05T12:00:00Z. Record score, decision, gaps and hard failures for selected policy and weight ablation. Run 1,000 in-process evaluations of one accelerator pair. Unit tests define targeted failure cases independently of matrix output; the matrix is diagnostic, not a 60-label accuracy benchmark.

**Result:** 75 unit tests and seven local browser/API groups pass. Five historical fixture decisions remain 5/5 correct; leading seed result remains 96.67. On Windows / Node 24.18.0, taxonomy timing median 0.0220 ms, p95 0.0569 ms. Runtime model calls/tokens = 0. Timing excludes D1, network and browser; development token use is not measured. Raw [taxonomy matrix](docs/benchmarks/v0.2-taxonomy.json) and [legacy regression](docs/benchmarks/v0.2-legacy-regression.json).

**Trade-off:** More policy surface and incomplete, coarse financial proxies. Scores are not cross-policy calibrated, credit approvals, investment probabilities or guarantees. The catalogue contains 14 fictional fixtures and one incomplete YC scaffold. No current terms or eligibility are invented.

**Next Action:** Establish a licensed, independently labeled corpus; test program-specific eligibility and resource utility before tuning weights or adding models. Real match precision, funding conversion, economic benefit and production load remain **UNMEASURED**.

## V0.1 Historical Benchmark

## Baseline

Score-only threshold >= 75 on the same fictional company/five-mandate fixture. No hard veto or evidence gate. This intentionally weak baseline tests the necessity of explicit gates, not superiority to commercial matchmaking or human diligence.

## Change

Two independently scoped match agents plus stage/geography/ticket/sector/revenue/product/team and accepted-capital hard filters, shared-evidence audit, unknown handling and human handoff gate.

## Measure

Fixed clock `2026-09-05T12:00:00Z`, versioned synthetic demo profiles, expected labels established by their configured mandates. `npm run benchmark` writes a machine-readable report in `docs/benchmarks/`. Timing: 1,000 in-process evaluations; excludes network, database, browser and model calls. Schema, security and browser tests are separate acceptance evidence.

## Result

Measured 2026-09-05 on Windows / Node 24.18.0:

- 34 unit tests pass; 4 browser/API workflow tests pass against actual local Worker/D1.
- Five fixed synthetic outcomes: 5/5 match the configured expected decisions.
- Score-only baseline: 2 false introduction eligibilities; gated engine: 0 on the same five constructed cases.
- 1,000 in-process evaluations: median 0.0126 ms, p95 0.0287 ms. Not end-to-end latency and not a production throughput claim.
- Leading demo fit: 96.67/100; second review-ready fit: 93.33/100.
- No model calls; runtime LLM token use is zero. This does not measure development token consumption or compare model quality.

Raw output: [v0.1-synthetic.json](docs/benchmarks/v0.1-synthetic.json). Browser assertions cover both onboarding flows, edits, real persistence, handoff history, trace events, owner isolation, filters, images and viewport containment at 1440, 390 and 360 px. See release notes for production verification.

## Trade-off

Explainable and reproducible rules cannot establish real capital availability, trust, company quality or funding probability. Five synthetic cases are too small and constructed to claim predictive accuracy. USD-only, a single-provider-ticket assumption and simple early-stage traction/team scoring intentionally narrow the scope.

## Next Action

Run the fixed benchmark and browser suite; then collect a licensed, independently labeled evaluation corpus before tuning weights or adding models. Real-world precision, conversion, revenue uplift, production load, accessibility conformance and token/cost benefit versus LLM alternatives remain **UNMEASURED**. This implementation has zero model calls; that alone proves no model-quality comparison.
