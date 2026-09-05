# V0.2 Funding Taxonomy Integration

## Boundaries

An additive minor update to V0.1, retaining owner-scoped D1 workspaces, CRUD, eight agent responsibilities, explicit consent and recorded-not-sent human actions. Product 0.2.0; engine rules-2.0.0; taxonomy capital-resources-0.2.0. No graph database, external ingestion, live LLM or autonomous introductions.

## Runtime

Canonical JSON -> strict Zod validation -> catalogue -> explicit policy -> shared company projection -> readiness -> bilateral screening -> evidence audit -> dimensions/reasons -> A2A events -> human review.

`fundingProfileOf` adapts legacy cash mandates. Seed VC keeps the historical seven-weight baseline; incubator, accelerator, angel, pre-seed VC, growth VC, PE, credit, programs and strategic mandates select distinct configurable policies. A canonical imported profile is authoritative: legacy compatibility fields are not used as facts or gates. Catalogue profiles show their own fields in the UI. Legacy mandates remain editable through the existing form; custom canonical profiles can be supplied through the typed API. No full canonical-profile editor is claimed in V0.2.

`companyStage` has eleven labels; `financingRound` is independent. `acceptedCategories` overrides legacy provider preferences when explicitly set. Additional form controls handle resources-only requests, category consent and nullable financial disclosures.

## Evidence and Scoring

The same `screenFunding` policy is used for catalogue previews and persistent A2A runs. A profile's policy is selected explicitly, not maximized across category scores. JSON policies add product, financial disclosure and repayment dimensions. These proxies are deliberately coarse. They do not evaluate management talent, market size, retention, valuation, EBITDA, collateral, legal eligibility or real credit risk.

Current shared evidence is required only where the selected policy or provider needs it. Missing product or revenue is not a universal rejection for formation programs. Financial statements, operating cash flow and debt are needed for growth/PE/credit. Credit adds repayment source and debt-service coverage checks; it still cannot approve a loan. PE's initial policy is ordinary growth/buyout screening, not special-situations underwriting.

Hard failures > evidence gaps > score. 75 is an internal review threshold, not an investment probability. Unknown fields, incomplete scaffolds, stale/future sources and restricted evidence cannot be cured by a higher score. Programme-specific eligibility and current terms require human diligence even after a review-ready result.

## API

- GET /api/funding-catalogue: public taxonomy, 15 profiles, four fictional company examples; no workspace allocation.
- GET /api/funding-schema: generated structural JSON Schema.
- GET /api/funding-catalogue/:slug: one canonical JSON entity.
- POST /api/funding-catalogue/:slug/preview: exactly one exampleId or companyId. Workspace company requires its owner cookie and consent. Same-origin and bounded JSON. Returns match plus complete trace; not persisted and not eligible for a handoff.
- POST /api/funding-catalogue/:slug/import: explicit copy into the caller's private workspace, then normal versioned matching. Sequential duplicate imports return the existing profile. Concurrent duplicate imports are not transactionally deduplicated yet.

No third-party URLs are fetched by these APIs. Catalogue URLs are references only. No real private company data is returned by the public catalogue endpoint.

## Migration

No SQL migration required: optional fields extend validated profile JSON. New engine decisions include policyId. Old results remain readable but are stale for handoffs after engine changes; rerun rather than silently rescore history. V0.1 benchmark is retained; new benchmark artifacts are separate.

## Validation and Remaining Work

Unit tests cover schema, eleven stages, categories, readiness, all policies, finance gates, non-investing entities, source freshness and old-result staleness. Browser tests cover browsing, preview, import, workspace isolation, consent, original workflow and three viewport widths.

Real investor fit, conversion, legal/regulatory compliance and economic utility: UNMEASURED. Next work: jurisdiction-specific policies; claim-level verification; parent/offer profiles; signed bilateral sharing; exact underwriting; labeled real-world evaluation and only then verified KYC ingestion.
