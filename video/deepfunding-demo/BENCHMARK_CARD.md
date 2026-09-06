# Agent City Film Benchmark Card

Date: 2026-09-06. Film v0.1; product V0.3 remains unchanged.

## Baseline

The remote repository had a written 20-30 second film concept but no runnable
3D film or MP4. This is a new deliverable, not a measured quality uplift.

## Change

Procedural Three.js city, 53 characters, two cutaways, bidirectional traffic,
18-node fan-out / top-3 illustration, pure-time camera and matching geometry,
review-aware overlays, original synthesis and deterministic H.264 export.

## Measure

Fixed timeline: 28 seconds / 840 frames / 1920 x 1080 / 30 fps.
Six tests cover every frame's finite coordinates, contiguous narrative, camera
continuity, startup arrival, random-access equivalence and animation lifecycle.
Fixed browser samples: 1.8, 5.5, 9.5, 14.5, 18.8, 21.1, 23.0, 26.6 seconds.
Canvas checks require variance > 200; motion frames must differ; 53 agents;
cutaway opacity < 0.2; three final visible matching links. Mobile: 390 x 844,
uncropped 16:9, no horizontal overflow, keyboard scrub/play/pause/restart.
Export manifest records duration, frame count, file bytes, SHA256 and wall time.

## Result

Unit tests: 6 passed. Browser/visual preflight: passed.
Final encoding: 840 decoded frames, exactly 28 seconds, H.264 / yuv420p,
1920 x 1080 at 30 fps, AAC stereo / 48 kHz, 27,240,989 bytes. Frame-render wall
time 424.142 seconds, followed by color-range/audio mastering. Full decode PASS.
Audio measured mean -22.0 dBFS and peak -7.4 dBFS after mastering; no clipping.
SHA256: `9e9862bad1ba32cd7f59c869743818813701aa76d31389a6557789a114c5e5e0`.
Raw local evidence: `output/render-manifest.json` and `output/media-verification.json`.
Viewer comprehension, business conversion, funding outcomes, Remotion speed
comparison and model-provider token usage: UNMEASURED. No inference model is
called by the scene or exporter; no financial transaction is performed.

## Trade-off

Direct Three.js / Playwright / FFmpeg keeps one time source and no remote media
dependency, but screenshots are an offline export path, not real-time recording.
Preview does not play the soundtrack. Geometry is stylized; labels are not a
replacement for detailed live-product demonstrations.

## Next Action

H.264/AAC decode and eight final encoded frames were verified. Next: obtain
specific audience feedback before revising pacing, narration or realism.
