# Startup Stages

Supported labels: idea, pre_company, prototype, pre_seed, seed, series_a, series_b, series_c_plus, growth, mature, buyout_ready.

These are discovery labels, not a mandatory funding ladder. Early labels describe formation/product maturity; round-style labels are historical shorthand for operational stages. `companyStage` is user-declared and not independently inferred from revenue. `financingRound` separately records none, pre_seed, seed, series_a, series_b, series_c_plus or null (unknown).

A mature bootstrapped company can have financingRound=none. An idea-stage founder can apply to a suitable accelerator; revenue is not universally required. The system never treats an absent financing history as seed-funded.

Compatibility: absent companyStage maps the old stage label; explicitly null stays unknown. No old D1 record is rewritten. Readiness output reports this basis and missing evidence.
