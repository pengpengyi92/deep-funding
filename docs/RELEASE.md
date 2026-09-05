# V0.1 Release

Date: 2026-09-05. Version: 0.1.0. Engine: rules-1.0.0.

Website: [Deep Funding](https://pengyi-deep-funding.pengpengyi92.workers.dev/).
Repository: [pengpengyi92/deep-funding](https://github.com/pengpengyi92/deep-funding).
Cloudflare Worker version: `a1ec2619-6a0c-4b21-a9c6-8eca62572454`.

## Verified

- TypeScript strict typecheck and Vite production build pass.
- 34 unit tests pass for matching, schemas, privacy projection, sorting, knowledge taxonomy and the optional explanation boundary.
- Four Playwright browser/API workflow groups pass locally (10.4 seconds for the final run).
- The same four groups pass against the live Cloudflare URL (37.8 seconds): onboarding both sides, matching, D1 persistence after reload, recorded handoff, trace, edit versioning, owner isolation, hard veto, stale/consent checks, filters and responsive image/layout assertions.
- Screenshots inspected at 1440 px desktop and 390/360 px mobile; working page assets render and no horizontal overflow is detected. No browser page errors in the responsive test.
- Fixed synthetic benchmark recorded in `docs/benchmarks/v0.1-synthetic.json`.
- Independent D1 database initialized with all nine migration statements. Scheduled expiry cleanup registered. Test workspaces deleted after successful production tests.
- Dependency audit on installation: zero reported vulnerabilities.

See [adversarial self-review](REVIEW.md) for defects found during testing and remaining limitations. Repository publication/CI results are recorded in the GitHub history and Actions run, not presumed from local tests.

## Release Scope

Public open-source fictional-data sandbox: eight deterministic agent modules, editable profiles, bilateral matching and a real persistent human-request queue. **No automatic outreach, live investor directory, financial execution, independently verified source material or active LLM provider.**
