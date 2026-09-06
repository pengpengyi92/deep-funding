# Incubator / Accelerator / Angel / VC / PE Ecosystem Map

Date: 2026-09-06

## Core distinction

These institutions overlap, but their primary function differs.

| Type | Typical stage | Primary value | Capital required? | Typical role |
|---|---|---|---|---|
| Incubator | 0 → 1 | workspace, registration, mentors, policy access, cloud/compute, ecosystem resources | No | help a team/company get started |
| Accelerator | 1 → N | intensive program, network, customers, fundraising, Demo Day, growth resources | No, but often invests | accelerate an existing MVP/startup |
| Angel Investor | pre-seed / seed | personal capital + optional founder/operator network | Yes | early equity investor |
| VC | seed → growth | institutional equity capital + portfolio support | Yes | pursue venture-scale returns |
| PE | growth / mature | larger equity checks, growth equity, buyouts, M&A / control / exit | Yes | invest in more mature companies |

## Incubator vs Angel

The key distinction is **resource platform vs investment role**.

An incubator can provide office space, company-registration support, mentors, policy/subsidy access, cloud credits, university/industry connections and other startup infrastructure. It does **not** have to invest cash or take equity.

An angel investor's defining action is investing capital into an early-stage company, usually for equity or an equity-like instrument. An angel may also provide introductions, mentoring, customers or office resources, but those are optional rather than the defining function.

Therefore:

> Incubator = startup-enablement infrastructure first.
>
> Angel = early risk capital first.

## Accelerator vs Incubator

A useful heuristic for DeepFunding routing is:

- **Incubator: 0 → 1** — idea/team formation, company setup, MVP formation, basic startup infrastructure.
- **Accelerator: 1 → N** — a startup already has a team/MVP or initial traction and needs faster product-market, customer, fundraising and growth loops.

This is a heuristic rather than a hard legal boundary. Programs can overlap substantially.

## Do incubators and accelerators invest?

Not necessarily.

- Incubators may provide resources without direct investment.
- Accelerators may provide only programs/resources, or may combine resources with investment.
- Some accelerators are also investors. Y Combinator is a canonical example of the accelerator + early-stage investment model.

Thus DeepFunding should model `program/resources` and `capital` as separate attributes instead of assuming that an incubator/accelerator always or never invests.

## Government / university / corporate / private ownership is a separate axis

`Incubator`, `Accelerator`, `Angel`, `VC`, and `PE` describe **economic/function roles**. Ownership/sponsorship should be modeled separately:

- government-backed
- university-backed
- corporate-backed
- private/market-based
- state-owned / government-guided capital

For example, an incubator may be government-backed, university-backed, corporate-backed or private. Chinese incubator ecosystems often have significant government, industrial-park and university participation, but `incubator ≠ government`.

## DeepFunding implication: two-dimensional taxonomy

DeepFunding should avoid a single flat `funding_type` field. At minimum separate:

1. **Provider role**: incubator / accelerator / angel / VC / CVC / PE / bank / government fund / grant / strategic investor.
2. **Resource bundle**: capital / workspace / compute / policy / subsidy / mentor / customer / distribution / talent / research / fundraising network.
3. **Startup stage**: idea / pre-seed / seed / Series A / growth / mature.
4. **Sponsor/ownership**: government / university / corporate / private / state-owned / hybrid.

This allows a Founder Agent to ask not merely **“Who will give me money?”**, but **“What combination of capital and resources is optimal for my current stage?”**

## Lifecycle routing

A conceptual path is:

`Idea → Incubator → Accelerator → Angel/Pre-seed VC → Seed/Series A VC → Growth VC/PE → IPO/M&A`

This is not mandatory or strictly sequential. The purpose is routing: DeepFunding should recommend the right provider type for the founder's current stage and bottleneck.

## Product implication

A future **Funding Lifecycle Router Agent** can infer founder stage + bottleneck and route to a bundle of providers. Example:

`AI demo + early team + no company infrastructure` → incubator / university ecosystem / grant → accelerator → angel / pre-seed VC.

This expands DeepFunding from an investor-matching product into a broader **Capital & Growth Infrastructure Graph**.