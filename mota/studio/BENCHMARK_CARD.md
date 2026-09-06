# ModelScope Deployment Candidate

Date: 2026-09-06

## Baseline

Cloudflare public Worker/D1 and React site are live. Local FastAPI/SQLite is
loopback-only. No authenticated ModelScope Studio has been verified.

## Change

An NGINX Docker package serves the same compiled public frontend and 1080p film,
proxying /api/ only to the existing Cloudflare public backend. It listens on
7860, rejects cross-origin mutations, limits request bodies to 32 KiB and
forwards only the demo session cookie rather than platform credentials.

## Measure

Falsifiable question: can this additional hosting surface retain the existing
public app without duplicating backend state or exposing the local database?
Fixed checks: index/health, watch page, 1024-byte video Range, cross-origin and
missing-origin mutation rejection, hidden file rejection and upstream health.
Linux CI builds the actual Docker image and runs this fixed protocol.

## Result

Local public packaging: 9 assets, 21,411,647 bytes. Manifest hashes are written
under .local/modelscope-studio-package. TypeScript: 132 tests; typecheck passed.
Container and actual Studio measurements are pending, not inferred.

## Trade-off

NGINX reuses established static/Range/proxy behavior. This avoids relaxing local
database protection, but depends on Cloudflare availability and cross-region
egress. Hosted-private and independent ModelScope backend parity are not claims.
Container latency, availability, cost and audience effectiveness: UNMEASURED.

## Next Action

Read Linux CI results, authenticate ModelScope, confirm account and free
resource availability, deploy, and test the real app origin/cookie workflow.
