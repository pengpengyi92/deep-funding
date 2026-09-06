---
title: Deep Funding
license: mit
sdk: docker
app_port: 7860
---

# Deep Funding on ModelScope

Deployment candidate, not a verified live Studio as of 2026-09-06.

This image serves the public React application and its film on port 7860.
Its same-origin /api/ gateway calls the existing public Cloudflare Worker and
fictional D1 sandbox. This is a hybrid deployment, not an independent ModelScope
database or a live LLM service. Local private SQLite files are excluded.

## Prepare

From the Deep Funding repository:

```sh
npm ci
npm run build
node scripts/package-modelscope.mjs
docker build -t deepfunding-studio .local/modelscope-studio-package
docker run --rm -p 7860:7860 -e STUDIO_PUBLIC_ORIGIN=http://localhost:7860 deepfunding-studio
```

The package contains only built public assets, the NGINX configuration and its
entrypoint, licence, deployment README and a SHA-256 manifest. Do not upload the
entire working directory, local databases, .env files, credentials or dependencies.

## Deploy

1. Authenticate to ModelScope in a user-controlled login flow or a local secret
   environment. Never paste tokens into chat, Git remote URLs or logs.
2. Confirm the account owner and any existing DeepFunding Studio before creation.
3. Query current Docker hardware/base-image options. Choose an available free
   resource only. Docker account binding/real-name requirements must be satisfied.
4. Sync this package to the confirmed Studio repository using a credential helper.
   Inspect existing content and merge deliberately; do not force-push.
5. Set STUDIO_PUBLIC_ORIGIN to the actual HTTPS app origin returned by the Studio.
   The catalogue wrapper and iframe may have different origins. Open the app in a
   new tab for the fictional workspace if the platform iframe blocks cookies.
6. Deploy, inspect build and run logs, then check /healthz, knowledge search,
   workspace creation/demo, private API rejection and video seek.
7. Record the actual Studio URL, revision and test evidence. Do not call it
   deployed merely because a Git push succeeded.

With the default origin, mutations return 403 until configured. Only the
df_session demo cookie is sent upstream; platform cookies, Authorization and
ModelScope/Studio headers are not forwarded. The upstream URL is fixed, not
user-selectable. Public demo sessions expire after seven days. Cross-domain
browser sessions are distinct even though the backend is shared.

No real company documents, contact details or investment mandates belong in the
public fictional sandbox. Hosted private authentication and isolation remain
separate future work. A Cloudflare outage or blocked cross-region egress will
make API features unavailable; the static page and film remain served locally.
NGINX provides native byte-range video delivery.

## References

- https://modelscope.cn/skills/modelscope/ModelScope-Studio
- https://github.com/modelscope/modelscope-skills/blob/main/skills/ms-studio-deploy/SKILL.md
- https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- https://nginx.org/en/docs/http/ngx_http_core_module.html

