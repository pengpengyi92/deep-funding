# Benchmark Card: Deep Funding V0.1

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
