# Contributing

Use a `codex/` or descriptive feature branch. Keep changes bounded and add a failing regression case before fixing matching, privacy or protocol behavior. Run `npm run check` and `npm run test:e2e` before a PR. Include baseline, change, measured result and trade-off; mark anything not measured explicitly.

Do not add real investor contacts, private profiles, proprietary documents, credentials, third-party scraped datasets or fabricated verification. External sources require provenance, usage rights and an explicit untrusted-input boundary. Never let LLM text override a hard constraint or grant access to private evidence. Disclose synthetic data and disabled integrations.

Policy changes need a new engine version, updated fixtures and benchmark results. Frontend changes need desktop/mobile screenshots. Coordinate public API changes with schemas and protocol documentation.
