#!/bin/sh
set -eu
# Permit a single origin only. Never interpolate arbitrary NGINX configuration.
if ! printf '%s' "$STUDIO_PUBLIC_ORIGIN" | grep -Eq '^https?://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?$'; then
  echo "STUDIO_PUBLIC_ORIGIN must be an exact origin with no path" >&2
  exit 1
fi
case "$STUDIO_PUBLIC_ORIGIN" in
  http://localhost:*|http://127.0.0.1:*|https://*) ;;
  *) echo "Non-local Studio origins must use HTTPS" >&2; exit 1 ;;
esac

