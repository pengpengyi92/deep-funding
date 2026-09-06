# DeepFunding Agent City Film

A 28-second, 1920 x 1080, 30 fps 3D product-concept film. This is an animated
architectural set, not a screen recording, GIS reconstruction, real funding
transaction or claim that autonomous outreach is implemented in V0.3.

## Run

Requirements: Node 22.12+ (tested with Node 24), FFmpeg with libx264/AAC on PATH,
and Playwright Chromium. No API key, credentials or private database is used.

```bash
cd video/deepfunding-demo
npm ci
npx playwright install chromium
npm run dev
```

Preview: `http://127.0.0.1:5197`. Play/pause, restart and scrub controls are below
the full 16:9 frame. The live 3D preview is silent; the exported MP4 includes the
original soundtrack. Mobile preview retains the entire frame, without cropping.

```bash
npm test
npm run stills
npm run verify
npm run render
npm run build
```

Open `watch.html` for the finished MP4 with native playback/fullscreen/download
controls. After export, `node scripts/verify-media.mjs` checks the actual codecs,
resolution, 840 decoded frames, 28-second video/audio and eight encoded stills.

`output/deepfunding-demo.mp4` is the final H.264/yuv420p file with AAC stereo
audio. `FFMPEG_PATH` can override the FFmpeg executable. Rendering starts a
loopback-only Vite server, samples the same scene at `frame / 30`, captures
Chromium frames and feeds FFmpeg. The server and browser close afterwards.
`output/` is generated and ignored by Git; publish MP4 as a release asset rather
than repeatedly committing binary revisions.

## Storyboard

| Time   | Sequence                                             | Purpose                                         |
| ------ | ---------------------------------------------------- | ----------------------------------------------- |
| 0-4s   | Qianhai-inspired bay, towers, promenade and two hubs | Establish the funding ecosystem                 |
| 4-8s   | Both buildings and two-way pedestrian flow           | Company side and capital/resource side          |
| 8-12s  | Company building cutaway; highlighted startup        | Information, analysis and audit                 |
| 12-17s | Follow the startup along the A2A bridge              | Structured profile and funding need             |
| 17-20s | Funding building cutaway; 18-node fan-out            | Search a network, not cold-contact every person |
| 20-24s | Three retained connections and conversation          | Illustrative fit scores; human review           |
| 24-28s | Pull back, network arcs, brand ending and fade       | Agent-to-Agent Funding Infrastructure           |

53 stylized 3D characters: 18 company agents, 18 funding agents, 16 two-way
pedestrians and one highlighted startup. Glass exterior opacity falls from
0.90 to 0.12 at each cutaway; interior floors, desks and characters remain.
City, characters, geometry, labels, camera, paths, textures and synth audio are
repo-native procedural assets. There are no downloaded models or music samples.

## Boundaries

- Fictional `Enterprise AI / Seed / Shenzhen / CNY 10M` profile.
- Scores `92 / 86 / 74` are illustrative ranking points, not measured match
  quality, probabilities of investment or loan eligibility. Bank credit review
  is explicitly pending. All real financial/eligibility claims remain outside
  this video.
- The depicted conversation is scripted. `INTRODUCTION CANDIDATE` and human
  review replace an unqualified assertion of contact sharing. No email, account,
  phone, capital movement or third-party integration occurs.
- Incubators and accelerators are ecosystem/resource providers, not presumed
  investors. The film's funding-side building includes this broader network.
- `Fund.` in the ending is a product ambition, not a completed funding outcome.
- No changes to the V0.3 backend, private SQLite or production Worker were
  required to make this film.

## Implementation Decision

The brief suggests R3F / GSAP / Remotion. This isolated first version uses
Three.js directly with a pure time-indexed timeline and Playwright / FFmpeg.
It preserves the required preview/render interface and exact frame count while
avoiding a second React composition and timeline engine for a single film.
This is a scope/dependency decision, **not** a measured performance claim over
Remotion. Comparative export speed, memory and editing productivity: UNMEASURED.

- `src/world.js`: geometry, cutaways, characters, labels, matching and lighting.
- `src/timeline.js`: camera keys, narrative, waypoints and lifecycle.
- `src/main.js` / `style.css`: frame-synchronized overlays and preview controls.
- `scripts/audio.mjs`: original deterministic PCM synth score and event pings.
- `scripts/render.mjs`: frame capture, encoding, hash and manifest.
- `scripts/verify.mjs`: browser, canvas, motion, cutaway and mobile checks.

References: [Three.js](https://threejs.org/docs/),
[Playwright screenshots](https://playwright.dev/docs/screenshots),
[FFmpeg](https://ffmpeg.org/ffmpeg.html).
Source brief: the owner's 2026-09-06 attachment, also preserved in
[`../../log/2026-09-06-3d-demo-video.md`](../../log/2026-09-06-3d-demo-video.md).

## Known Limits

This is the first low-poly architectural-film release, not photoreal CGI.
Characters use procedural limb motion, not mocap, collision avoidance or crowd
simulation. Smaller role labels are secondary details best viewed full-screen.
No voice-over, real GIS, 4K or independently tested audience-conversion claim.
The 3D preview has a single roughly 564 kB uncompressed bundle; Vite emits its
normal 500 kB size advisory. Production application bundling is unaffected.
