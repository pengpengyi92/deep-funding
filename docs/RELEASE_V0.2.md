# V0.2 Release: Capital + Resource Taxonomy

This is the taxonomy component of the combined [RSI major release](RELEASE_V0.2_RSI.md), not a separate published release.

Date: 2026-09-05. Product: 0.2.0. Engine: rules-2.0.0. Taxonomy: capital-resources-0.2.0.

## Scope

- Funding knowledge base: nine groups, sixteen category tags, capital instruments, non-financial resources and source metadata.
- Eleven company-stage labels, independent financing history, nullable financial inputs and evidence-readiness output.
- Ten explicit matching policies, no highest-score policy selection. Existing seed-demo result remains 96.67.
- Non-investing incubators support resource-only requests without a cash ticket. Bank and PE require financial evidence; credit adds repayment checks.
- Explorer with category/search, full profile, downloadable JSON, explainable A2A preview, workspace import and ordinary persisted matching.
- Four fictional companies, fourteen fictional funding profiles, one partial YC official-source scaffold. Unknown terms and deadlines stay unknown; no self-assigned verification.
- Old-engine results remain in history but become stale for handoffs. No database schema migration or private-data backfill.

## Local Verification

75 unit tests; seven Playwright browser/API groups; 1440, 768 and 390 px Explorer checks plus original mobile/image tests. Complete original A2A workflow, state isolation, consent, JSON limits, imports and incomplete-profile gates remain tested. Fixed 60-pair diagnostic matrix and five historical expected labels are recorded separately.

During verification a browser-select label was made explicit. A local Wrangler asset-watcher 404 after rebuilding dist required restarting the already-running local server; no production deployment failure is inferred from that development-server behavior. Screenshots were reviewed and a clipped skip-link was hidden correctly until keyboard focus.

## Publication

GitHub/Cloudflare verification is recorded below after deployment. Local tests alone are not publication evidence.

## Limits

No verified real investor network, live LLM, funding transaction or automatic outreach. Domain policy weights and readiness scores are coarse internal heuristics. Current legal/program eligibility, terms, underwriting and investment decisions still need qualified human review. See [integration details](FUNDING_TAXONOMY.md).
