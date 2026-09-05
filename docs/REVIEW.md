# V0.1 Adversarial Self-Review

Date: 2026-09-05. Scope: matcher, API, sharing, persistence and browser workflow. This is an implementation self-review, not an independent security certification.

## Issues Found and Corrected

1. **Score tie outranked audit readiness.** The first browser run opened the incomplete Firstlight mandate instead of Meridian when both scored 96.67. The shared comparator now sorts decision priority before score and uses deterministic name tie breaks. A regression test asserts ready/gap/reject ordering; the API and UI share it.
2. **Cross-side evidence ambiguity.** Evidence IDs are namespaced and scoring explicitly selects company evidence for team/traction, funder evidence for mandate. Schemas prohibit cross-side evidence types and duplicate IDs.
3. **Concurrent handoff trace overwrite.** Human actions now use a transaction, unique per-match-kind key, atomic JSON event append and DB-assigned sequence. Matching profile versions are checked again by the insertion statement. Repeated actions do not duplicate events.
4. **Private evidence leakage risk.** Matching projects shareable fields before running side agents. Private notes and restricted evidence source strings are covered by serialization-level negative tests.
5. **Stale decisions reused after edit.** Both profile versions and run date are checked before handoff; introduction eligibility is recalculated. API tests reject stale and hard-failed handoffs.

## Remaining Risks / Scope Limits

- Anonymous browser sessions are suitable only for synthetic demos; they are not organization identity.
- Rate limits are approximate and per edge location. Profile/run counts are soft demo guardrails under concurrency. Production quota/load testing is unmeasured.
- The profile form is last-writer-wins across stale tabs; the database CAS prevents simultaneous in-flight writes, but no client revision precondition is currently required. Existing match versions still become stale.
- No independent document verification, legal diligence, live fund availability or real-world matching accuracy is established.
- LLM and external-data integrations are interface boundaries, not active network providers. Do not market eight rule methods as eight live language-model workers.
- Expiry access control is enforced on each API call. Scheduled database purge exists; provider backup retention is not controlled by the app.
- UI keyboard focus, labels, reduced motion and mobile layout are checked in code/screenshots; full WCAG certification and independent penetration testing are unmeasured.
