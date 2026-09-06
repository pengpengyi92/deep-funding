# Changelog

## v0.3.0 - 2026-09-06

### Added
- SQLite/SQLAlchemy persistent local backend and FastAPI CRUD / OpenAPI docs.
- Founder, company, funding-provider, funding-preference and funding-need records.
- Saved matches, input snapshots, four-stage Agent run history and audits.
- Lightweight subscription metadata, without billing or entitlement enforcement.
- Private Data Explorer with forms, search, filters, sorting and JSON detail.
- Funding RAG Graph, Shenzhen sourced seed knowledge and public knowledge explorer.
- Compliance RAG Graph with typed claims, disputed-case handling and human-review prompts.
- Public-index drift checks, real process-restart test, browser privacy tests and CI gates.

### Preserved
- V0.2 Worker/D1 sandbox, eight original Agent contracts, capital/resource catalogue,
  browser RSI, shared TypeScript RSI engine, CLI and TUI.
- Public/private boundary: private SQLite does not deploy to Cloudflare.

### Known Limits
- Metadata/keyword retrieval baseline only. Real match accuracy is UNMEASURED.
- Hosted accounts, multi-tenant authentication, cross-device private sync, payments,
  licensed ingestion and external introductions remain future work.

## v0.2.0

Capital/resource taxonomy, Founder/Funding RSI, versioned benchmarks, CLI/TUI
and local-first browser analysis. See docs/RELEASE_V0.2.md.

## v0.1.0

Working fictional A2A sandbox with deterministic agent roles, D1 persistence,
audits, match decomposition and a recorded human-introduction queue.
