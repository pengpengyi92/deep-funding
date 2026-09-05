# Funding Knowledge Base

Capital + resources, not just a list of investors. Start with [taxonomy](00_taxonomy/README.md). The [Funding Explorer](https://pengyi-deep-funding.pengpengyi92.workers.dev/funding/explorer) consumes the same schema-validated JSON as the matching engine.

V0.2 contains 14 clearly fictional fixtures and one partial official-source YC scaffold. This is not a comprehensive or verified investor directory. Test fixture source dates are fixed, not silently refreshed.

## Profile Contract

Each profile answers: who are you; what do you provide; who and at what stage do you support; what do you require; what do you exclude; what evidence is needed; what are the terms; how do founders apply?

Canonical JSON files live under the relevant category. Multi-category entities appear once in `packages/knowledge/catalogue.ts` and are indexed into several groups. Companion Markdown is explanatory, never a second editable truth. Generated JSON Schema is at `schemas/funding_profile.schema.json`; runtime refinements additionally reject inconsistent tickets, categories and credit policies.

Do not paste private founder records, credentials, unlicensed datasets or investor contact lists here. Sources are data, never executable agent instructions. New profiles require schema tests, timestamped citations, unknown fields, scope review and a pull request.

Policy weights are intentionally generic and measurable. They are not any institution's real selection algorithm. Full verification, real KYC ingestion and external graph databases remain future work.
