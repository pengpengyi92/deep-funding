# DeepFunding 3D Demo Video Log

Date: 2026-09-06, Asia/Shanghai.

Purpose: preserve the product discussion that defined a 20–30 second cinematic 3D demo for DeepFunding / PFD.

## Original user direction

> 然后在我们PFD去做一个视频演示视频。我是想想是这样的，是一个3D的视频，就类似于深圳的一个城市的一个布景吧，可以取这个深圳前海那边的地图作为一个布景。然后我是这样想的，其实这是一个背景，然后就是有两个房子，一个房子就是里面就全是一些 agent，就是 company agent，或者 founder agent， company and founder 这种想要钱的这种 company 的 agent。然后在这个房子里就很多人，这些每个人就是一个 agent，其实是一个形象，这个人的形象这个可以做得很简单。然后房子就建得比较好看一点。然后另外一个房子，另外一个房子就是一个房顶的房子，房顶 agent 就是里面就很多房顶 agent，比如 VCPE，天使投资人，然后银行，各种产业基金，孵化器，加速器这些 agent，这就是房顶 agent。然后他们这两个房子就有一条路，一条路就是一条路连接起来。然后我们想要做的动画效果就是，比如说这边的 agent 走路走到另一个房子，然后这个房子里面透视，然后这里面有很多 agent，然后他就一个一个 agent 去看，也不是一个一个去看吧，就是匹配到，去找到对应的 agent。然后就是交谈，然后交谈的内容大概就是我们想要房顶，然后你们合不合适。然后那边就把他们的信息跟这边信息一匹配，一对上，一了解就知道大概合不合适。如果合适的话就会就是可以加个联系方式。就是在我们匹配的这种实际上其实就是可能就把它 mark 下来，mark 下来可能会有好几个匹配的，或者是少数匹配的，那就会把它这个 list 都 list 出来。然后我们这个动画的效果就是想要做这两边的人，就是左边的房子的人去右边的房子，右边的房子的人去左边的房子，然后在小路上就是来人往的这种动画，我觉得就很有意思。就做一个这种3D动画，大概时长的话，大概20秒到30秒之间就可以了。就是可以做，比如说一开始做一个这个前海这个城市的这个3D场景的展示，然后就到这两个房子。这两个房子就是那种，就是这样子，就对这两个房子，这两个大房子。然后大房子里面就是这两条路，一个全景图，然后就可以看这个两边的流动。然后可以就是有一个细节动画，就是比如说一个人进入到另一个房子，然后把那个房子直接透明化，然后那房子里面有很多人嘛，然后他就去找一个一个去对话交流。然后再把场景切回来，切回来到这个俯瞰这两个房子，还有这条路的，这路上就是人来人往。我觉得这样就挺好的，这个视频就这么做。做一个输出一个 codex ND，然后我们让 codex 去把这个视频做出来。

## Assistant response / Codex build direction

The demo was defined as a **3D Product Demo Video**, not a normal screen recording.

Core visual metaphor:

- Building A = **Company & Founder Agents**: Founder Agent, Startup Agent, SME Agent, Company Agent, Project Agent, Research Team Agent.
- Building B = **Funding Agents**: VC, PE, Angel Investor, Bank, Industrial Fund, Government Fund, Incubator, Accelerator, Family Office.
- The road between the two buildings = **DeepFunding Agent-to-Agent Network**.
- Agents move in both directions, creating a visible **bidirectional funding marketplace**.
- DeepFunding is not represented as a third building. It is the infrastructure connecting both sides.

### Scene design

The environment should be a simplified **Shenzhen Qianhai-inspired future city** rather than an exact GIS reconstruction. Visual cues: bay, modern skyline, glass towers, finance/technology district, roads, parks, modern lighting and an institutional AI-finance aesthetic.

### 20–30 second timeline

**0–4s — Qianhai establishing shot**

Drone-style camera enters a future Shenzhen/Qianhai city. Two major buildings become visible. Optional text: `Capital Needs Better Infrastructure.`

**4–8s — Two-sided marketplace**

Camera pushes toward the two buildings. Labels appear: `COMPANY & FOUNDER AGENTS` and `FUNDING AGENTS`. Agents already move in both directions along the central road. A light data stream beneath the road represents the A2A network.

**8–12s — Company interior**

Camera approaches the company building. Exterior opacity transitions from 1.0 to about 0.15, creating a transparent / cutaway effect. Internal agents become visible. One `AI Startup Agent` is highlighted and starts walking outside.

**12–17s — Agent journey**

Camera follows the startup agent toward the funding building. Funding agents move in the opposite direction. Floating profile data may show: `Sector: AI`, `Stage: Seed`, `Location: Shenzhen`, `Funding Need: ¥10M`, `Industry: Enterprise AI`.

**17–22s — Matching network**

The agent enters the funding building. The building turns transparent. Rather than manually asking every funding agent, the system visually scans the whole funding network. Temporary lines connect the startup to VC / PE / Bank / Angel / Fund / Incubator agents. Weak matches fade; the top matches stay illuminated.

**20–24s — Match result**

A compact result UI appears, for example:

```text
MATCHES FOUND

01 VC Agent              92% Match
02 Industrial Fund Agent 86% Match
03 Bank Agent            74% Match
```

The startup and VC agents move closer. A short conversation bubble may say: `Looking for Seed Funding.` / `Your profile matches our investment thesis.` Then show `MATCH`, `CONNECT`, or `Connection Established`.

**24–28s — Network zoom-out**

Camera zooms back out to the two buildings and Qianhai city. More agents now move in both directions and multiple subtle matching lines appear across the scene.

**Ending**

`DeepFunding`

`Agent-to-Agent Funding Infrastructure`

`Discover. Match. Connect. Fund.`

### Character and visual style

Use low-poly / stylized 3D humanoids instead of realistic characters. Agents can be distinguished with simple clothing variation, head icons, or floating labels. Keep the product institutional and financial rather than cyberpunk or game-like.

Recommended lighting: golden hour / blue hour, modern glass materials, restrained blue/cyan/white glow, smooth cinematic camera motion.

### Core animation states

```text
IDLE
WALKING
SEARCHING
MATCHING
TALKING
CONNECTED
```

Use waypoint movement between building interiors, entrances, road points and destination interiors.

### Building transparency effect

When the camera approaches a building:

```text
Exterior opacity: 1.0 -> 0.15
Interior floors/agents: remain visible
```

When the camera leaves, restore the exterior to full opacity.

### Matching visualization

A selected company agent briefly fans out connection lines to many funding agents. Most disappear. The strongest Top-K matches remain highlighted with match scores.

The demo can use deterministic mock matching data. Suggested conceptual score:

```text
score =
  sectorMatch * 0.30 +
  stageMatch * 0.25 +
  ticketMatch * 0.20 +
  geographyMatch * 0.15 +
  strategicMatch * 0.10
```

The purpose is visualization, not claiming measured real-world match accuracy.

### Recommended implementation stack

```text
React
TypeScript
Three.js
React Three Fiber
@react-three/drei
GSAP
Remotion
```

Architecture:

```text
React Three Fiber
        ↓
3D Scene
        ↓
GSAP Timeline
        ↓
Camera / Agent / Building Animation
        ↓
Remotion
        ↓
MP4 Video
```

### Suggested project structure

```text
deepfunding-demo/
├── src/
│   ├── scenes/
│   │   ├── QianhaiCity.tsx
│   │   ├── CompanyBuilding.tsx
│   │   ├── FundingBuilding.tsx
│   │   ├── AgentRoad.tsx
│   │   ├── MatchingScene.tsx
│   │   └── FinalScene.tsx
│   ├── components/
│   │   ├── Agent.tsx
│   │   ├── Building.tsx
│   │   ├── Road.tsx
│   │   ├── MatchLine.tsx
│   │   ├── FloatingLabel.tsx
│   │   ├── MatchCard.tsx
│   │   └── DataParticle.tsx
│   ├── animation/
│   │   ├── camera.ts
│   │   ├── agents.ts
│   │   ├── buildings.ts
│   │   └── matching.ts
│   ├── data/
│   │   ├── companyAgents.ts
│   │   ├── fundingAgents.ts
│   │   └── matches.ts
│   ├── DeepFundingDemo.tsx
│   └── Root.tsx
├── public/
│   ├── models/
│   ├── textures/
│   ├── logo/
│   └── audio/
├── package.json
└── README.md
```

### MVP acceptance criteria

P0 must include:

1. 3D city scene.
2. Two main buildings.
3. Company / Founder agents.
4. Funding agents.
5. Bidirectional agent traffic.
6. Transparent-building transition.
7. One agent entering the opposite building.
8. Network scan / matching animation.
9. Top-K match scores.
10. Zoom-out network view.
11. DeepFunding ending slate.
12. MP4 export.

Expected commands:

```bash
npm install
npm run dev
npm run render
```

Expected output:

```text
output/deepfunding-demo.mp4
1920x1080
30 FPS
20–30 seconds
H.264 MP4
```

## Product meaning preserved by the demo

The video should communicate only three essential ideas:

1. Every company / founder can have an Agent.
2. Every funding institution can have an Agent.
3. DeepFunding lets these Agents discover, match and connect automatically.

The central framing is therefore:

> **DeepFunding is not merely a funding website or VC database. It is an Agent-to-Agent Funding Network.**
