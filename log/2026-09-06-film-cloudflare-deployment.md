# Agent City film on Cloudflare

Timestamp: 2026-09-06T13:34:00+08:00

## Baseline
The 28-second 1080p/30fps film was available only on localhost.
Its 27,240,989-byte master exceeded the 25 MiB static-asset limit.

## Change
- Preserved the original master locally.
- Encoded a 17,888,147-byte H.264 CRF20 web version, copying original AAC audio.
- Added /watch.html, a homepage entry, poster, versioned MP4 and SHA256 manifest.
- Implemented single-range streaming for the one published MP4. No database changes.
- The Assets binding omitted Content-Length, so ranges use the generated manifest as a fallback.
- Tightened browser verification after an early test falsely passed a blank post-seek frame.

## Measure / Result
- 132 TypeScript tests passed, including 16 Range/HEAD/error cases.
- TypeScript typecheck and Vite build passed (existing large-bundle warning remains).
- Public HTTP Range returns 206 with Content-Range: bytes 0-1023/17888147.
- Chrome validates 28 seconds, 1920x1080, playback, seeking and actual nonblank pixels.
- Desktop 1440x980 and mobile 390x844 inspected, full 16:9 image without cropping.
- Cloudflare version: 1a76919f-bbdc-498d-a156-45e5ca00b341.
- URL: https://pengyi-deep-funding.pengpengyi92.workers.dev/watch.html

## Trade-off / Next Action
Re-encoding reduces filesize, with a modest compression trade-off. Range requests stream
through the Worker and consume invocations. Move larger/high-traffic media to R2 or Stream
after usage warrants it. Concurrent media load remains UNMEASURED.
The film is a synthetic concept, not a real investment network or actual financing outcome.
