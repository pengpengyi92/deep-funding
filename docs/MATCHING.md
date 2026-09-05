# Matching Policy: rules-1.0.0

This is a demonstration policy, not investment advice or a universal funding eligibility standard.

## Hard Filters

Company accepts the provider's capital type; provider accepts stage, geography, requested **single-provider ticket**, sector exclusions, minimum MRR and any required working product / technical team. Unknown is not false or zero: it requires information. `Global` on the provider permits any supported region, without asserting legal eligibility.

## Evidence Gate

Required company evidence: product, traction, team. Required funding evidence: current mandate. Supporting evidence needs a nonempty source, `PROVIDED` provenance, `PUBLIC` or `MATCH_ONLY` visibility and a date no more than 180 days old and not in the future. No evidence is independently verified by this program. Positive MRR with zero customers is flagged for reconciliation. Unknown product/team/traction facts block review readiness.

## Weighted Fit

| Dimension | Weight | Value                                                                |
| --------- | -----: | -------------------------------------------------------------------- |
| Stage     |     25 | Within mandate: 1; otherwise 0                                       |
| Sector    |     20 | Preferred sector: 1; otherwise 0                                     |
| Ticket    |     15 | In inclusive range: 1; otherwise 0                                   |
| Geography |     10 | In supported region / Global: 1; otherwise 0                         |
| Traction  |     10 | With usable company evidence: 0.5 for customers > 0, 0.5 for MRR > 0 |
| Team      |     10 | Technical founding team with usable company evidence: 1              |
| Strategic |     10 | Fraction of requested resources supplied; unspecified needs: 0       |

The first four and strategic dimensions are profile/mandate claims, not authenticated facts. Their score can be displayed even when a required evidence gate is missing. The separate gate prevents a recommendation on that basis. Traction/team are simplistic demo preferences, not a claim that every good company must be technical or have MRR.

Scores are `sum(weight × value)`, rounded to two decimal places. Weights are configurable at the engine boundary and must sum to 100. The public API does not accept arbitrary client weights. Give policy changes a new engine version and rerun the fixed benchmark.

Decision precedence: `REJECTED` (hard failures) → `REQUEST_MORE_INFORMATION` (gaps) → `INTRODUCTION_READY` (score ≥ 75) → `LOW_FIT`.

## Reproducible Fixture

Arcwell AI (fictional): Seed AI, Greater China, three technical founders, working product, twelve customers, USD 18k MRR, USD 1.5m requested ticket. Meridian Seed Partners (fictional) accepts the hard criteria and covers two of three strategic needs.

`25 + 20 + 15 + 10 + 10 + 10 + 6.67 = 96.67`. This is not the illustrative 91 in the brief and must not be tuned just to display it.

Atlas exercises stage/ticket/revenue rejection; Northline exercises geography rejection; Firstlight has missing mandate evidence. All fixture dates are passed explicitly. Real-world precision, conversion, funding outcomes and fairness are **UNMEASURED**.
