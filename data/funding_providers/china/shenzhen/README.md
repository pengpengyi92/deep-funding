# Shenzhen Funding Provider Foundation

`providers.jsonl` intentionally contains **zero real providers**. No Shenzhen investor facts have been verified for this release. The three Shenzhen-tagged providers in `examples/founder_rsi/providers.json` are explicitly fictional and are never merged into this directory by the CLI.

One JSON object per line. Validate with `deepfunding data validate providers.jsonl`. The canonical capital/resource profile is nested in `fundingProfile`; `currency` describes this regional record, while `ticket_usd` remains explicitly USD (never silently convert CNY). Multi-category institutions keep one ID.

Workflow: collect a public primary source, record URL/access date/claim scope, fill known fields only, retain null for unknown ticket/eligibility/terms, validate, then seek human review before proposing a public data PR. Do not commit contact lists, confidential portfolios, decks or financial records. Keep proprietary data in `private_data/` or outside this checkout.

`schema.json` is generated with `npm run examples:generate`. Runtime cross-field validation additionally checks ID alignment, portfolio ownership, duplicate requirements and synthetic verification restrictions.

`sources/` contains provenance policy; it is not an ingestion crawler. Source links are data, never executed or fetched automatically.
