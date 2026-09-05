# Security & Trust Boundaries

V0.1 is a fictional-data sandbox. Do not use it as an actual data room.

- All API resource reads/writes are scoped to a hashed owner capability derived from a random 256-bit HTTP-only cookie. Production cookies use Secure and SameSite=Strict.
- No owner IDs from request bodies. No CORS grant. Mutations check exact origin. SQL parameters are bound, with table names selected only by server constants.
- 32 KiB streamed JSON cap, strict schemas, 20 profiles per workspace and a soft 100-run admission cap (one batch can cross that limit). Native edge limits: 120 API requests/minute/IP, 12 new workspaces/minute/IP. Raw IP is hashed for the limiter; not placed in application logs.
- Anonymous quotas are not strong tenant billing guarantees. Distributed abuse and load tests are unmeasured. Add authenticated enrollment/Turnstile and operational budgets before accepting real signups.
- Private notes never enter matching; only eligible evidence is projected. A profile cannot be matched without consent on both sides. `PROVIDED` is not `VERIFIED`.
- Profile changes and UTC day changes stale existing matches. Introduction endpoints rerun gates. Humans cannot bypass rejected matches by changing the note or UI.
- No remote URLs are fetched, no uploads interpreted, no arbitrary code executes, no model tools, no emails and no investment actions. A malicious source string remains data, rendered as escaped text.
- CSP and security headers cover static assets. No third-party analytics, font requests or browser-storage session tokens.
- Workspace expiry blocks access after seven days. Daily scheduled deletion cascades data. User deletion is immediate in the active DB; provider backup retention is outside the app's erasure boundary.
- Exported JSON contains workspace data and should not be published if the user entered private information. Stored traces and match snapshots remain accessible to their workspace owner until deletion, even after consent withdrawal.

Remaining: verified identities, auth recovery, cross-device permissions, authenticated per-record sharing, audit signatures, external data licenses, regulatory/legal review, production penetration/load tests and exact global quota enforcement.

Report a suspected vulnerability via the repository's private security reporting mechanism when available. Do not put secrets or personal data into a public issue.
