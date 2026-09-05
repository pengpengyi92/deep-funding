// These are discovery labels and review prompts, not eligibility recommendations.
export const fundingKnowledge = [
  {
    id: "angel",
    capitalType: "Angel",
    review: [
      "Individual decision authority",
      "Ticket and risk tolerance",
      "Founder evidence",
    ],
  },
  {
    id: "pre_seed",
    capitalType: "VC",
    review: ["Problem evidence", "Founding team", "Product milestone"],
  },
  {
    id: "seed_vc",
    capitalType: "VC",
    review: [
      "Product evidence",
      "Early customer quality",
      "Runway and use of funds",
    ],
  },
  {
    id: "series_a",
    capitalType: "VC",
    review: [
      "Retention and cohorts",
      "Repeatable acquisition",
      "Unit economics",
    ],
  },
  {
    id: "series_b_c",
    capitalType: "VC",
    review: ["Scaling efficiency", "Governance", "Market concentration"],
  },
  {
    id: "growth",
    capitalType: "VC",
    review: ["Revenue durability", "Cash-flow quality", "Exit assumptions"],
  },
  {
    id: "private_equity",
    capitalType: "PE",
    review: [
      "Ownership and control",
      "Financial diligence",
      "Value-creation plan",
    ],
  },
  {
    id: "bank_credit",
    capitalType: "Bank",
    review: [
      "Repayment sources",
      "Debt and covenants",
      "Collateral and credit eligibility",
    ],
  },
  {
    id: "incubator",
    capitalType: "Incubator",
    review: [
      "Program scope",
      "Resources actually available",
      "IP and participation terms",
    ],
  },
  {
    id: "accelerator",
    capitalType: "Accelerator",
    review: ["Cohort timing", "Equity terms", "Program time commitment"],
  },
  {
    id: "industrial_fund",
    capitalType: "Industrial fund",
    review: ["Industrial fit", "Commercial dependencies", "Capital authority"],
  },
  {
    id: "policy_fund",
    capitalType: "Policy fund",
    review: [
      "Current official eligibility",
      "Jurisdiction and deadlines",
      "Reporting obligations",
    ],
  },
  {
    id: "strategic_investor",
    capitalType: "Strategic investor",
    review: [
      "Resource contribution",
      "Conflicts and exclusivity",
      "Strategic versus financial objectives",
    ],
  },
] as const;
