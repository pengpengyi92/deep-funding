# Deep Funding V0.2 Combined Implementation Log

User direction: combine the RSI major update with the in-progress funding taxonomy patch. Previous taxonomy work was retained, not published independently or rewritten. Remote Mac-authored `log/DEEP_FUNDING_TEAM_BRIEF.md` remains untouched.

## Scope Decisions

- Existing React/TypeScript/Cloudflare architecture remains. The brief's Python tree was illustrative; one TypeScript engine is reused by GUI, CLI and TUI.
- RSI = Recursive Selection Intelligence. Deterministic personal/institution-specific benchmark, not an investment outcome predictor.
- Capital/resource taxonomy supplies provider type, policy and evidence gates. Historical interaction and portfolio similarity cannot override hard failures.
- Private RSI operates in browser memory or local files. Existing explicitly-created A2A D1 workspaces remain separate. No RSI remote inference/upload was added.
- Shenzhen directory has schema and strict ingestion, not fabricated real institutions. All portfolio/company examples are synthetic; the separate YC scaffold preserves unknowns.

## Implementation and Measurements

Eight cohort modes, feature weights/ranges/directions, missing coverage, threshold/percentile, similarity, append-only versioned observations, stale export rejection, provider requirements, CLI command tree and seven-screen TUI. New GUI `/rsi` exposes local file imports and both workflows.

113 unit/CLI/TUI tests passed. Initial two new test failures were incorrect fixture index/slug references, fixed to select explicit provider IDs. Existing 75 taxonomy/legacy tests remained passing. CLI runs both complete specified workflows and rejects JSON-interactive mode. Benchmarks retain raw artifacts and do not claim funding performance gains; in-process RSI median 0.02145 ms / p95 0.051975 ms, 1,000 samples after warm-up.

All nine local browser/API groups passed, including zero requests during RSI import/run/export and 1440/768/390 viewport checks. A select label was made explicit for keyboard/accessibility tooling. TUI was also opened and navigated in a real Windows terminal; a process exit hook confirmed code 0 after q, despite the host PTY wrapper returning its own status. Help/q navigation was shortened to fit 80 columns. Raw local evidence stays under ignored artifacts/.

Tracking issue: #1. Bounded follow-ups: #2 verified Shenzhen sources, #3 grouped temporal evaluator, #4 Unicode terminal cell widths. These are real unfinished improvements, not duplicate issues for already-implemented features. Discussions enabled. Public deployment/CI/release links follow after completion. No private source inputs or user credentials are included in this public log.

## Verified Public Delivery

- [PR #5](https://github.com/pengpengyi92/deep-funding/pull/5) merged; implementation `45d79ea`, merge `3b071a1`.
- [Branch CI](https://github.com/pengpengyi92/deep-funding/actions/runs/33959025517) and [PR CI](https://github.com/pengpengyi92/deep-funding/actions/runs/33959030405) pass.
- Cloudflare version `a9ad14e3-9446-473d-8107-55c7dbdd164b` deployed to the existing Worker; no DB reset/migration. Nine production browser/API groups pass (50.5 seconds), in addition to nine local groups and 113 unit/CLI/TUI tests.
- [RSI](https://pengyi-deep-funding.pengpengyi92.workers.dev/rsi), [Explorer](https://pengyi-deep-funding.pengpengyi92.workers.dev/funding/explorer), [Announcement #6](https://github.com/pengpengyi92/deep-funding/discussions/6).
- Epic #1 closed. Three bounded future issues stay open. No raw private input data was published. The runtime remains deterministic; actual funding efficacy is not measured.
