#!/bin/sh
set -eu
base=http://localhost:7860
curl --fail --retry 15 --retry-connrefused --retry-delay 2 "$base/healthz"
curl --fail "$base/" > /tmp/deepfunding-index.html
grep -q 'Deep Funding' /tmp/deepfunding-index.html
curl --fail "$base/watch.html" > /tmp/deepfunding-watch.html
grep -q '<video' /tmp/deepfunding-watch.html
status=$(curl -s -o /tmp/deepfunding-range.bin -w '%{http_code}' -H 'Range: bytes=0-1023' "$base/film/deepfunding-demo-v1.mp4")
test "$status" = 206
test "$(wc -c < /tmp/deepfunding-range.bin | tr -d ' ')" = 1024
status=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Origin: https://foreign.invalid' -H 'Content-Type: application/json' -d '{}' "$base/api/workspace")
test "$status" = 403
status=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' "$base/api/workspace")
test "$status" = 403
status=$(curl -s -o /dev/null -w '%{http_code}' "$base/.env")
test "$status" = 403
# Read-only upstream connectivity. No public workspace mutation in CI.
curl --fail --max-time 40 "$base/api/health"
printf '\nStudio container smoke passed\n'

