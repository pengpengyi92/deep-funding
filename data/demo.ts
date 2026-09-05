import type { Company, Funder, Evidence, Profile } from "../packages/schemas";
const evidence = (field: Evidence["field"], date: string): Evidence => ({
  id: `${field}-01`,
  field,
  label: `Fictional ${field} evidence`,
  source: `Synthetic demo fixture: ${field}, not an independently verified document.`,
  observedAt: date,
  visibility: "MATCH_ONLY",
  provenance: "PROVIDED",
});
export function demo(now: Date) {
  const date = now.toISOString().slice(0, 10);
  const company: Company = {
    name: "Arcwell AI",
    description:
      "Fictional agent infrastructure company building observable execution and evaluation workflows for enterprise teams.",
    location: "Shenzhen / Hong Kong",
    website: "",
    stage: "Seed",
    region: "Greater China",
    sector: "AI",
    raiseUsd: 1500000,
    capitalTypes: ["VC", "Angel", "Strategic investor"],
    mrrUsd: 18000,
    customers: 12,
    teamSize: 3,
    technicalTeam: true,
    workingProduct: true,
    useOfFunds: "Product development, enterprise distribution and recruiting.",
    strategicNeeds: [
      "Enterprise distribution",
      "Technical expertise",
      "Overseas expansion",
    ],
    shareForMatching: true,
    privateNotes:
      "Synthetic internal workspace note. Never included in A2A messages.",
    evidence: ["product", "traction", "team"].map((f) =>
      evidence(f as Evidence["field"], date),
    ),
  };
  const base: Funder = {
    name: "Meridian Seed Partners",
    description:
      "Fictional seed mandate for AI and SaaS infrastructure in Greater China and Singapore.",
    location: "Hong Kong / Singapore",
    website: "",
    capitalType: "VC",
    stages: ["Seed", "Series A"],
    regions: ["Greater China", "Singapore"],
    sectors: ["AI", "SaaS"],
    excludedSectors: [],
    ticketMinUsd: 500000,
    ticketMaxUsd: 3000000,
    minimumMrrUsd: 0,
    requiresProduct: true,
    requiresTechnicalTeam: true,
    strategicResources: ["Enterprise distribution", "Technical expertise"],
    shareForMatching: true,
    privateNotes: "Synthetic mandate only.",
    evidence: [evidence("mandate", date)],
  };
  const funders: Funder[] = [
    base,
    {
      ...base,
      name: "Harbor Strategic Ventures",
      capitalType: "Strategic investor",
      description:
        "Fictional corporate investor with enterprise distribution resources.",
      strategicResources: ["Enterprise distribution"],
    },
    {
      ...base,
      name: "Atlas Growth Capital",
      description:
        "Fictional growth-stage investor; intentionally incompatible with a seed-stage company.",
      stages: ["Growth", "Mature"],
      ticketMinUsd: 10000000,
      ticketMaxUsd: 50000000,
      minimumMrrUsd: 250000,
    },
    {
      ...base,
      name: "Northline Seed",
      description:
        "Fictional North America-only seed fund; demonstrates a geography rejection.",
      regions: ["North America"],
    },
    {
      ...base,
      name: "Firstlight Angels",
      description:
        "Fictional angel syndicate with an unverified, incomplete mandate.",
      capitalType: "Angel",
      evidence: [],
    },
  ];
  const profile = <T>(data: T, kind: "company" | "funder"): Profile<T> => ({
    id: crypto.randomUUID(),
    kind,
    version: 1,
    data,
    updatedAt: now.toISOString(),
  });
  return {
    companies: [profile(company, "company")],
    funders: funders.map((f) => profile(f, "funder")),
  };
}
