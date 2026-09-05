# Architecture Decision: Small Complete Vertical Slice

Date: 2026-09-05. Source: Pengyi's `DEEP_FUNDING_CODEX.md` build brief and clarifying two-sided agent architecture. This implementation is a new public repository; no private funding repository content, contacts or credentials were imported.

## Decision

React + Vite for a typed responsive frontend, a Worker for the API and D1 for owner-scoped storage. Shared TypeScript modules implement matching independently of the hosting stack. Unlike the suggested PostgreSQL/pgvector stack, V0.1 does not need vector search or cross-organization identity. Avoid pretending that an anonymous demo is a production capital marketplace.

## Ownership

`workspaces` → `profiles`, `runs`, `matches`, `requests`. All queries use an owner capability derived from the session token, never a client-supplied owner ID. Foreign keys cascade on deletion. Profile changes increment the version; matches capture both versions. A changed version, new UTC date or withdrawn consent blocks new handoffs. Introduction creation re-evaluates the current hard/evidence gates.

Each side owns four distinct module methods: information normalizes and projects shareable fields, analysis summarizes needs/mandate, audit evaluates provenance/freshness/completeness, match independently checks its constraints. These methods are bounded deterministic agents, not eight autonomous language-model processes. The matching layer combines both decisions. New providers may annotate decisions, never overwrite them.

## Protocol

The trace carries an explicit message type, sequence, UUID, timestamp, protocol version, endpoints, evidence references and structured payload. Company and funder version snapshots travel through normalization, analysis and audit before `MATCH_REQUEST` and `MATCH_RESPONSE`.

Missing evidence yields a `GAP_REQUEST`. A human-recorded response creates `GAP_RESPONSE`; it does not mark a fact verified. Update the source profile and rerun. A human request generates `HUMAN_HANDOFF` with `RECORDED_NOT_SENT`. There is no transport integration. This is a versioned internal protocol, not claimed compliance with Google's A2A specification.

## Falsifiable Decisions

- Rules versus free-form LLM matching: fixed constraints must reject every labeled hard-fail fixture. Test before allowing any model annotation.
- Score-only versus gated matching: measure false introduction eligibility on the same fixed fixture set. Do not calibrate weights to a desired demo score.
- Worker/D1 versus a multi-service stack: fixed demo workload must survive reloads and enforce owner isolation in the actual runtime. Production concurrency, verified identities and large catalogs remain unmeasured.
- Profile revision protection: old results must fail to create handoffs after either profile changes.

## Cost & Scale Boundary

No model calls or commercial data. At most 20 profiles per workspace; matching is exhaustive O(company × funder). API and creation rate-limit bindings, request-size bounds and seven-day expiry limit exposure. Edge rate limits are approximate/per-location, not a globally exact billing or DDoS shield. Move to authenticated quotas before opening real user enrollment.

References checked for implementation:

- [Cloudflare D1 API](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Worker best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [Rate-limit bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
