# ModelScope Package and Chinese Deck

Timestamp: 2026-09-06T13:52:00+08:00

Follow-up after the Cloudflare film deployment:

- Inspected the user-provided ModelScope Studio skill and local mota materials.
- Recorded historical document corrections separately instead of rewriting the
  original Word/MD materials.
- Browser login iframe failed to connect; no ModelScope token is configured.
  No Studio owner, repo, paid resource or successful ModelScope deployment is claimed.
- Built a public-only hybrid deployment package: NGINX serves 9 compiled assets
  (21,411,647 bytes), with API requests going to the existing Cloudflare public
  Worker. The local private database is excluded.
- The package refuses reuse of an existing destination to avoid stale/private
  additions. A per-file SHA-256 manifest records the exact public assets.
- Docker Linux daemon is unavailable on this Windows host. A dedicated Linux CI
  job builds and tests the image; the actual result must be checked.
- Follow-up typecheck caught an over-broad Fetcher test cast. The film helper
  now declares its actual fetch-only dependency; all 132 tests and typecheck pass.
- A separate ten-slide fully Chinese deck, six editable tables and Chinese
  speaking notes were created in PPPT. English PPTX already exists on main and
  stays unchanged. Chinese commit: 9000e09, PPPT PR #3.

No changes to private SQLite access, trading, real-world outreach or payments.

## Verification Follow-up

2026-09-06T13:54:00+08:00: the first container probe raced NGINX startup.
The readiness probe now tolerates transient connection resets with bounded
retries; it still fails a persistent startup error. Linux Docker build and all
fixed smoke checks passed at commit 5c53cd2 (run 34015044262).
ModelScope account authentication and actual Studio deployment remain pending.
PPPT PR #3 merged to main b79e0b4; Chinese remote/local blob IDs match exactly.
