# Deep Funding V0.3.0 Acceptance

Date: 2026-09-06

## Verified locally

| Requirement | Evidence |
| --- | --- |
| Company/provider create and persist | Python tests plus actual browser forms |
| Nullable early-company financials | Missing-revenue test and browser JSON inspection |
| Stored profiles feed agents and matches | Matching service reads ORM rows, writes Match + four AgentRuns + AuditRecord |
| Restart preserves data | Two independent Uvicorn process instances share a temporary SQLite file |
| Human can inspect data | Data Explorer tables, filters, sorting, pagination and pretty JSON |
| Funding knowledge | 18 sourced records, three classification nodes and five templates |
| Multiple VC/PE/bank references | Four Shenzhen VC, two PE/growth, three bank references |
| Compliance knowledge | Two named source references, nine templates, three classification nodes |
| Disputed status / response | Xiaohongshu has media_report, company_statement, disputed_claim and analysis labels |
| Both graphs feed agent output | Stored retrieval arrays include source URLs and content hashes |
| Regression and documentation | 116 TypeScript tests; 19 Python tests; 12 public/legacy + 5 private browser groups |

The process-restart test found and fixed a transaction lifecycle race: a response
could previously precede commit. Database dependencies now close their transaction
before response serialization completes. This is tested by immediately stopping
the server after successful HTTP responses.

## Deployment boundary

Public Worker routes expose only the generated public graph index. /api/v3/health
reports public-knowledge / persistent:false there. Private API endpoints respond
503 with an explicit local-workspace message. The local runtime reports
local-private / persistent:true and hosts the Data Explorer at port 8793.

No existing D1 data is deleted or migrated. No private SQLite file is uploaded.
No real profile is automatically imported into the fictional demonstration.

Cloudflare deployment: 3356dddf-8fdb-4d34-a639-362879d16e82, 2026-09-06.
Public URLs: /knowledge/funding, /knowledge/compliance and /data-explorer.

## Measurement

Windows / Python 3.11.3, 5 warmups + 25 transactions on one fixed synthetic pair.
SQL reads, retrieval, Match / four AgentRun / AuditRecord writes and commit included.
Median 5.9397 ms, p95 6.6422 ms. HTTP, browser and network excluded.
This is not an accuracy benchmark or a speed comparison to V0.2.

Runtime LLM calls/tokens = 0. Development tokens, real-world funding performance,
retrieval precision and credit/investment calibration = UNMEASURED.

## Residual work

The backend uses an initial idempotent schema bootstrap, not a production migration
system. Multi-tenant hosted accounts, backup automation, private cross-device sync,
entitlement enforcement and live models need separate implementation and gates.
Dependency warnings about Starlette's httpx compatibility and AnyIO alias remain
non-failing; frontend build emits a chunk-size warning. Neither is hidden.
