# [Data] Add three source-reviewed Shenzhen provider profiles

## Context
The V0.2 real Shenzhen JSONL registry is intentionally empty. Synthetic examples are not opportunities.

## Scope
Add at most three real provider profiles with primary-source URLs, accessed dates, exact claim coverage and explicit unknown fields. One entity can have multiple categories. Include an independent human review note.

## Non-goals
No private contact lists, web scraping automation, unverified ticket sizes, promised eligibility or inference from brand reputation.

## Acceptance Criteria
- `deepfunding data validate` accepts the JSONL.
- Every non-unknown mandate requirement is traceable to an official source.
- Unknown amounts/deadlines remain null; no synthetic verification status.
- No copyrighted documents or confidential portfolios committed.

## Tests and Files
Add source/unknown handling fixtures under tests; update data/funding_providers/china/shenzhen/providers.jsonl and sources/. Run npm run check.
