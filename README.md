# Deep Funding

**Companies want the right capital. Capital wants the right company. Let their agents meet first.**

Open-source, evidence-aware Agent-to-Agent funding matchmaking. Two top-level agents, eight scoped sub-agents, one inspectable match protocol. A runnable **fictional-data sandbox**, not an investor directory, investment recommendation or autonomous dealmaker.

## V0.2: RSI + Capital / Resources

**Your data. Your benchmark.** [RSI workspace](https://pengyi-deep-funding.pengpengyi92.workers.dev/rsi) combines Founder RSI, Funding RSI and an explainable, deterministic benchmark engine. GUI, keyboard-first TUI and CLI reuse the same TypeScript application services. Private RSI files stay in browser memory or a local terminal store; no remote inference or upload is implemented.

- Founder RSI: mandate gates + scoped interaction history + portfolio similarity; explain every component and unknown.
- Funding RSI: eight cohort modes, configurable feature weights/bounds, missing-data coverage, descriptive thresholds, empirical percentiles and append-only versioned observations.
- Shenzhen-first data foundation: strict JSONL/schema and source workflow, **zero verified real Shenzhen profiles** at this release. Three Shenzhen-labelled examples are fictional.
- Terminal: `npm run cli -- --help`, or `npm link` then `deepfunding --help` (`deepfunding.cmd` when PowerShell blocks npm's script shim).

Guides: [Founder RSI](docs/founder-rsi.md), [Funding RSI](docs/funding-rsi.md), [Benchmark](docs/benchmark.md), [CLI](docs/cli.md), [TUI](docs/tui.md), [Private data](docs/private-data.md).

### Capital + Resources

**Funding is not only money. Funding is the set of capital and resources that helps a founder or company reach its next stage.**

[Funding Explorer](https://pengyi-deep-funding.pengpengyi92.workers.dev/funding/explorer) now covers nine groups, sixteen multi-label categories, eleven company-stage labels and ten versioned screening policies. Browse, search, inspect source provenance, download canonical JSON and run a full A2A preview. Import a provider into your private workspace to reuse the existing audited workflow.

Institution categories, capital instruments and non-financial resources are separate. Company stage and financing history are separate. Resource-only requests do not need a cash ticket. Bank/PE/growth policies require financial disclosures; early-stage programs do not universally require revenue or a launched product. Readiness is evidence coverage, not funding probability.

The starter catalogue contains **14 fictional fixtures and one partial YC scaffold**, not 15 verified funding opportunities. YC terms, deadlines and incomplete mandate fields remain unknown. No application or introduction is sent. See the [knowledge base](funding/README.md), [integration notes](docs/FUNDING_TAXONOMY.md) and [V0.2 release](docs/RELEASE_V0.2.md).

![Deep Funding application](docs/images/overview.png)

## Try It

- [Open Deep Funding](https://pengyi-deep-funding.pengpengyi92.workers.dev/) · [Protocol and boundaries](https://pengyi-deep-funding.pengpengyi92.workers.dev/about)
- Click **Run the A2A demo** to create a private browser workspace, load one fictional company and five mandates, run both sides and inspect the leading match.
- Review the weighted decomposition, hard failures, evidence and A2A trace. Record an introduction request after human review. **No message is sent.**
- Company and Capital workspaces support creating/editing profiles, source evidence, audits, matching, JSON export and complete workspace deletion.

## Run Locally

Node.js 24 and npm are required. No LLM key or paid API is needed.

```bash
npm ci
npm start
```

Open `http://127.0.0.1:8791`. Local D1 migrations and the frontend build run before the Worker. The startup fails if the port is occupied; choose another port with `npx wrangler dev --port 8792` after the initial build.

```bash
npm run check
npx playwright install chromium
npm run test:e2e
npm run benchmark
```

For frontend hot reload: keep the Worker running and use `npm run dev:web` on port 5191. Mutations must stay same-origin through the Vite proxy.

## Architecture

```text
Company Agent                         Funding Agent
  Information                           Information
  Analysis                              Analysis
  Audit                                 Audit
  Match -------- A2A Match Layer ------ Match
                          |
             Explainable result + trace
                          |
              Human introduction queue
                    (recorded, not sent)
```

- `apps/web`: React, TypeScript, responsive routes and evidence/trace views.
- `apps/api`: Cloudflare Worker HTTP API, same-origin sessions and D1 persistence.
- `packages/agents`: eight deterministic agent responsibilities.
- `packages/schemas`: strict Zod inputs and typed output contracts.
- `worker-configuration.d.ts`: generated locally by `npm run types` / `npm run check`, not committed.
- `packages/a2a`: versioned application-level messages. No external A2A-standard interoperability claim.
- `packages/matching`: hard constraints, evidence gates and configurable weighted fit.
- `packages/knowledge`: canonical taxonomy, validated profiles, readiness, compatibility adapters and policy screening.
- `funding/`: category-governed Markdown knowledge base and canonical JSON profiles.
- `schemas/funding_profile.schema.json`: generated structural JSON Schema; runtime validation also applies cross-field rules.
- `packages/connectors`: provider-agnostic optional explanation and external-data boundaries. **No live providers configured.**
- `data/demo.ts`: entirely fictional demo profiles, generated with an explicit date.

## What Is Actually Implemented

Information → Analysis → Audit → bilateral Match → decision → human request, with real CRUD, database writes and inspectable protocol events. Matching uses **rules-2.0.0**, not a hidden LLM. The optional explanation adapter accepts only bounded text, labels it `INFERRED`, and cannot change the authoritative verdict. It is tested using a stub and is not invoked by the hosted app.

Mandates can be edited through the UI. Hard filters always veto scoring. A match requires current shared evidence and a score of at least 75 for human review. The sample leading match is **96.67**, calculated rather than forced to the brief's illustrative score. See [matching policy](docs/MATCHING.md).

## Privacy & Limits

**Use fictional data only.** The public demo has anonymous, cookie-bound workspaces, not verified company identities. A 256-bit HTTP-only session token is hashed before storage. Records are owner-scoped. Workspaces expire after seven days and are deleted by daily cleanup; users can delete earlier. Losing the cookie loses access. No account recovery, cross-device identity, partner invitations or real capital network exists in V0.2.

Core profile sharing requires explicit consent. Private notes and `PRIVATE` / `NDA_REQUIRED` evidence never enter A2A matches. `PUBLIC` means share-eligible inside this sandbox, not globally published. Existing snapshots remain in private history after consent withdrawal until deletion. All claims are `PROVIDED` or `UNKNOWN`; the app cannot self-assign `VERIFIED`. Source freshness is a configurable 180-day demo policy.

No uploads, due-diligence certification, investor verification, automatic emails, negotiation, investment transactions or guarantees. Notes and exports can contain the data **you** enter; do not commit them. Cloudflare's edge logs may include request metadata, but application logs never include profile bodies or session tokens. Database backups follow the hosting provider's retention; this is not a regulated data room.

See [security model](docs/SECURITY.md), [API](docs/API.md), [acceptance scope](docs/ACCEPTANCE.md) and [benchmark card](BENCHMARK_CARD.md).

## Deploy

```bash
npx wrangler login
npx wrangler d1 create deep-funding
# Set your own database_id in wrangler.jsonc; choose unique rate-limit namespace IDs.
npm run types
npm run db:remote
npm run deploy
```

Use a fresh database for each independent deployment. The checked-in deployment ID is a public resource identifier, not a credential. Keep credentials out of source control. GitHub CI checks types, unit tests, build and browser workflows. Deployments remain explicit CLI actions; CI does not have account secrets.

## Roadmap & Contribution

[TODO.md](TODO.md) separates V0.1 evidence from roadmap work: verified identities and consent, real provider adapters, semantic retrieval, signed inter-party messages, data rooms and financing-specific diligence. Pull requests should have clear scope, reproducible tests and an honest benchmark.

Code: MIT. See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [asset provenance](docs/ASSETS.md).
