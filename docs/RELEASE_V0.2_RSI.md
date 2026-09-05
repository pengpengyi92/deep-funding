# Deep Funding V0.2: RSI, TUI/CLI and Capital + Resource Taxonomy

Date: 2026-09-05. This combines the major RSI update and taxonomy patch into one release; the earlier standalone patch was not independently published.

## Delivered Scope

- Founder RSI: shared mandate gates, deduplicated dated interaction history, portfolio similarity, explainable ranking and coverage.
- Funding RSI: private portfolio ingestion, configurable features, eight cohort modes, thresholds, empirical percentiles, strengths/gaps and similarity.
- Recursive baseline: immutable versioned snapshots, strict temporal/data constraints, append-only observations and stale export detection. Not a learned model or automated funding decision.
- GUI `/rsi` uses local browser memory; CLI/TUI use the same application layer with a private local store. Existing A2A/D1 workflow remains separate.
- Shenzhen JSONL/schema/source infrastructure with zero verified real local providers. Synthetic examples are separate.
- Taxonomy patch: nine groups, sixteen categories, eleven stages, ten policies; capital/resources, financial gates, evidence readiness, Explorer and scoped imports. Details: [taxonomy release](RELEASE_V0.2.md).
- Strict examples/schema CI, CLI/TUI tests, browser privacy and responsive checks, contributor templates, source and privacy guides.

## Verification

Local verification: 113 unit/CLI/TUI tests and all nine Playwright browser/API groups pass. RSI import/run/export made zero browser requests in the privacy test. Desktop/tablet/mobile screenshots were inspected. Real Windows TUI opened, navigated to providers and exited with process code 0 (recorded inside Node; the host PTY wrapper reports a separate status). Deployment and GitHub CI evidence follows in the release log. Synthetic fixtures prove behavior, not commercial effectiveness. Actual funding accuracy, investment returns, calibrated cross-category quality and development token consumption are UNMEASURED.

## Publication Evidence

- Implementation commit: `45d79ea`; merged through [PR #5](https://github.com/pengpengyi92/deep-funding/pull/5), merge `3b071a1`.
- [Branch CI](https://github.com/pengpengyi92/deep-funding/actions/runs/33959025517) and [PR CI](https://github.com/pengpengyi92/deep-funding/actions/runs/33959030405) passed on Ubuntu / Node 24.
- Cloudflare Worker version `a9ad14e3-9446-473d-8107-55c7dbdd164b`; existing DB retained, no database migration.
- All nine deployed browser/API groups passed on 2026-09-05; original workflow, catalogue and local-only RSI verified against the public site.
- [Open RSI](https://pengyi-deep-funding.pengpengyi92.workers.dev/rsi) · [Funding Explorer](https://pengyi-deep-funding.pengpengyi92.workers.dev/funding/explorer).

## Remaining Limits

No real Shenzhen directory, automatic investor verification, LLM, remote inference, auto-outreach, funding transaction or AI weight tuning. Heuristic weights are user policies. Cohort selection/survivorship bias persists. Local file stores are single-writer and not encrypted by the app. TUI is a compact readline interface, not a full graphical terminal framework; wide-character cell accuracy is a follow-up.
