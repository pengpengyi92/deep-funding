# Agent City Film Implementation

Date: 2026-09-06, Asia/Shanghai.
Request: create the 3D video from the owner's attached DeepFunding/PFD brief.
Scope: `video/deepfunding-demo/`, isolated from V0.3 backend and production data.

## Source and Intent

Read the complete owner-provided 3D Product Demo Video Spec and fetched the
shared remote. Fast-forwarded to `f156de1`, preserving the independently added
3D concept log and expanded V0.3 documentation. Work branch:
`codex/deepfunding-3d-demo`. No private database or identity material is captured.

The film translates the two-sided funding marketplace into a Qianhai-inspired
architectural scene. DeepFunding is the connecting infrastructure, not a third
building. The aim is to explain the concept in under 30 seconds.

## Implementation

- 28-second continuous frame timeline at 30 fps, target 1920 x 1080 H.264 MP4.
- Procedural bay/city/towers/roads/parks/vehicles, glass and lighting.
- 18 company-side + 18 funding-side agents, 16 bidirectional pedestrians,
  one highlighted startup. 53 independent stylized characters in total.
- Company and funding cutaways, camera approach/follow/return, startup path.
- Fan-out to all 18 funding nodes, fade to three illustrated candidates.
- Synthetic profile, scripted conversation, human-review gate, brand ending.
- Original synthesized stereo score and match pings; no licensed samples.
- Deterministic Three.js -> Chromium frame capture -> FFmpeg encoding.
- Preview with pause/restart/scrub, unchanged 16:9 framing on mobile.

## Review and Corrections

First preflight exposed incompatible indexed/non-indexed geometry in batching;
normalized geometry before merging. A subsequent visual pass lowered washed-out
exposure, made matching lines visible through floors, removed a fast camera
side-switch, separated role labels from the highlighted agent, suppressed an
off-stage roof label under the shot heading, and made link origins follow the
startup's actual position. Added encoder-close/timeout handling after explicitly
stopping the first incomplete render to fix overlap. The incomplete MP4 is not a
deliverable; the final export overwrites it with a complete 840-frame artifact.

Six timeline tests and eight-scene browser checks pass locally. Tests cover
camera continuity, finite coordinates on every frame, random-access equivalence,
arrival/lifecycle, nonblank canvas, motion, glass opacity, top-3 connections,
mobile aspect ratio/overflow and actual keyboard preview control events.
Final encoded-file validation is recorded after rendering in the delivery record.

## Integrity

The film is explicitly labelled a product concept. `92/86/74` are synthetic
ranking points, not financing success probabilities. Bank credit review remains
pending. The script shows an introduction candidate, not actual contact sharing
or a funding decision. No automated emails, real investor conversations,
financial transactions, real GIS or private-company data are used. The closing
`Fund.` describes the ambition; it is not a verified outcome.

Three.js + Playwright/FFmpeg was selected as a smaller single-timeline path for
this isolated film. No superiority over Remotion has been measured. Real-time
performance, audience comprehension and conversion are not claimed.

## Persistence

Source, tests, instructions, benchmark and a path-scoped CI workflow are in the
repository. Generated MP4/audio/stills/manifests stay in ignored `output/` to
avoid binary churn. This task does not change the public Worker deployment;
the local finished video can be reviewed before public distribution.

## Final Artifact Verification

Completed 2026-09-06 13:17 Asia/Shanghai. `output/deepfunding-demo.mp4`:
28 seconds, 840 frames, 1920 x 1080, 30 fps, H.264 / yuv420p, AAC stereo 48 kHz,
27,240,989 bytes. Full decode PASS. Eight encoded frames extracted for visual
review. Rendering took 424.142 seconds, followed by a short mastering pass.
Mastering converted JPEG-derived full-range BT.601 to limited-range BT.709 and
normalized the original score: measured mean -22.0 dBFS, peak -7.4 dBFS.

SHA256: `9e9862bad1ba32cd7f59c869743818813701aa76d31389a6557789a114c5e5e0`.
Raw evidence is in `output/render-manifest.json`, `media-verification.json`,
`verification.json` and final encoded stills. Before-mastering video is kept
locally; it is not the deliverable. `watch.html` provides MP4 playback while the
Vite preview serves at `http://127.0.0.1:5197/`. CI workflow added, not yet run
on GitHub; these verification results are local.
