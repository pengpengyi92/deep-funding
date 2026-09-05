# V0.1 Acceptance Map

| Brief outcome                | Implemented boundary                                                   | Evidence                             |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| Company / funding onboarding | Real create/edit forms, typed validation, saved version                | Browser onboarding test              |
| Four agents on each side     | Eight deterministic methods with separate responsibilities             | Unit trace coverage                  |
| Company analysis / audit     | Stage summary, strengths/risks, freshness, consistency, unknowns       | Unit and API tests                   |
| Funding analysis / audit     | Mandate summary, current source requirements                           | Unit/API tests                       |
| A2A match                    | Independent constraints, weights and projected evidence                | Fixed fixtures                       |
| Match details                | Dimensions, source snapshot, both perspectives and next action         | Browser workflow                     |
| Agent trace                  | Versioned sequence, summaries, inspectable JSON, export                | Browser workflow                     |
| Human introduction           | Eligible request, persistent queue, idempotence, no outbound transport | API and browser tests                |
| Privacy controls             | Workspace isolation, consent, private/NDA exclusion, delete, expiry    | Unit/API tests                       |
| Public usable demo           | React + Worker + D1, responsive desktop/mobile                         | Screenshots and deployed smoke tests |

## Explicitly Not V0.1 Claims

No real investor directory, verified organization identity, machine-learned funding probability, email handoff, document ingestion, semantic search or A2A standard interoperability. LLM explanations have a provider-agnostic contract and tested validation boundary only; no live provider is configured. The knowledge base is a taxonomy of review questions, not a licensed dataset or financing eligibility engine.

Full legal-entity records, named founders and contacts, financial statements, liabilities, runway, valuation/instrument terms, ownership verification, multi-party access and NDA/data-room enforcement require later schemas and security review. `NDA_REQUIRED` currently means **excluded**, never automatically unlocked.

This delivers the brief's smallest complete demo slice, not every long-term capability in the brief.
