# Funding RSI

```bash
deepfunding rsi funding run --portfolio examples/funding_rsi/portfolio.json
deepfunding rsi funding score examples/funding_rsi/candidate.json
deepfunding rsi funding compare examples/funding_rsi/candidate.json --json
deepfunding data import examples/funding_rsi/config.json
deepfunding benchmark build
deepfunding benchmark export private-benchmark.private.json
```

Each portfolio row has company ID/name, provider ID, sector, stage, entry date, entry-time feature snapshot, provenance/source and nullable dated outcome. Monetary metrics in the demo explicitly use USD/year. No automatic FX conversion or financial statement interpretation occurs. Feature keys and units must be consistent across historical and candidate data.

All eight cohort modes are implemented. Set providerId, minimum sample count, minimum weighted coverage, percentile, date window or explicit IDs in the config. Empty cohorts and insufficient coverage return INSUFFICIENT_DATA instead of fabricated percentiles. `historical_average`/`historical_median` are descriptive entry-score summaries, not underwriting thresholds recommended by an advisor.

`rsi funding update new-record.json` validates and appends one observation. Duplicate IDs fail without modifying data. Export snapshots before a research revision; feedback does not silently retune weights. Quantitative superiority, investment return, fundraising success and automated decision quality remain UNMEASURED.

The BP/financial model/corporate structure/diligence checklist has 33 named dimensions. Provider-specific sourced expectations override the default unknown values (`requirementReview`). Generic document availability is not proof of correctness or actual eligibility. API for this review exists in the shared service; automated document reading remains out of scope.
