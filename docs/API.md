# HTTP API V0.1

JSON responses; no-store. Session cookie required except `/api/health` and workspace creation. Mutations require an `Origin` header equal to the URL origin. JSON bodies have a streaming 32 KiB cap. Unknown keys are rejected. All profile JSON schemas are exported from `packages/schemas`.

| Method     | Endpoint                              | Result                                                             |
| ---------- | ------------------------------------- | ------------------------------------------------------------------ |
| GET        | /api/health                           | Version / deterministic engine / outbound disabled                 |
| POST       | /api/workspace                        | New opaque browser session, or reuse current session               |
| GET        | /api/workspace                        | Owned profiles, matches, human requests, expiry                    |
| DELETE     | /api/workspace                        | Cascade delete owned data; clear cookie                            |
| POST       | /api/workspace/demo                   | Seed fictional profiles into an empty workspace                    |
| GET / POST | /api/companies                        | List / create company                                              |
| GET / PUT  | /api/companies/:id                    | Read / create next saved profile version                           |
| POST       | /api/companies/:id/analyze            | Analysis and persisted run ID                                      |
| POST       | /api/companies/:id/audit              | Audit and persisted run ID                                         |
| POST       | /api/companies/:id/matches            | Evaluate all consenting funding profiles; persist runs and matches |
| GET / POST | /api/funders                          | List / create mandate                                              |
| GET / PUT  | /api/funders/:id                      | Read / version a mandate                                           |
| POST       | /api/funders/:id/analyze              | Funding analysis and run                                           |
| POST       | /api/funders/:id/audit                | Funding audit and run                                              |
| POST       | /api/funders/:id/matches              | Independently evaluate all consenting companies                    |
| GET        | /api/matches/:id                      | Match, stale flag and human requests                               |
| POST       | /api/matches/:id/request-info         | `{ "note": "..." }`; record information request                    |
| POST       | /api/matches/:id/respond-info         | Record response after a request; no audit override                 |
| POST       | /api/matches/:id/request-introduction | Record an eligible human handoff; no sending                       |
| GET        | /api/agent-runs/:id                   | Full structured trace                                              |

Errors use `{ "error": "..." }`. 400 validation; 401 missing/expired session; 403 origin; 404 absent/other-owner object; 409 consent, stale match or workflow conflict; 413 oversized payload; 415 wrong content type; 429 demo capacity/rate limit. Errors never include SQL details, session tokens or profile content.

Requests are deduplicated by `(owner, match, kind)`. A request and its trace event are stored in one D1 transaction. The SQL trace append assigns a sequence at update time. UI forms edit the whole profile and increment its version. Concurrent profile writes use optimistic version comparison at the database update.

This API is intentionally same-origin/browser-first. It is not a public authenticated organization-to-organization transport; bearer API keys, verified ownership, signed messages and role-based collaboration are future work.
