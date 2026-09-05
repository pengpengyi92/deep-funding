export const taxonomyVersion = "capital-resources-0.2.0";
export const categories = [
  "incubator",
  "accelerator",
  "angel",
  "venture_capital",
  "corporate_vc",
  "private_equity",
  "strategic_investor",
  "government_fund",
  "industrial_fund",
  "grant",
  "subsidy",
  "bank",
  "venture_debt",
  "family_office",
  "crowdfunding",
  "university_fund",
] as const;
export type Category = (typeof categories)[number];
export const categoryGroups: {
  id: string;
  name: string;
  categories: Category[];
  description: string;
}[] = [
  {
    id: "incubators",
    name: "Incubators",
    categories: ["incubator"],
    description:
      "Company formation, validation and practical support. Capital is optional.",
  },
  {
    id: "accelerators",
    name: "Accelerators",
    categories: ["accelerator"],
    description:
      "Structured founder support and networks; stage and investment terms vary by program.",
  },
  {
    id: "angel",
    name: "Angel",
    categories: ["angel"],
    description:
      "Individual or syndicate capital; check mandate, authority and instrument.",
  },
  {
    id: "venture_capital",
    name: "Venture capital",
    categories: ["venture_capital", "corporate_vc"],
    description:
      "Pre-seed through growth mandates, including corporate venture capital.",
  },
  {
    id: "private_equity",
    name: "Private equity",
    categories: ["private_equity"],
    description:
      "Growth equity, buyouts and special situations require different underwriting.",
  },
  {
    id: "strategic",
    name: "Strategic",
    categories: ["strategic_investor"],
    description:
      "Commercial and strategic alignment alongside any capital investment.",
  },
  {
    id: "government",
    name: "Government",
    categories: ["government_fund", "industrial_fund", "grant", "subsidy"],
    description:
      "Policy objectives, geography and program-specific eligibility, not automatic free money.",
  },
  {
    id: "banks",
    name: "Banks & debt",
    categories: ["bank", "venture_debt"],
    description:
      "Repayment, covenants and debt capacity. Venture debt is not necessarily bank-issued.",
  },
  {
    id: "other",
    name: "Other",
    categories: ["family_office", "crowdfunding", "university_fund"],
    description:
      "Mandates vary; university affiliation and platform rules need separate checks.",
  },
];
export const companyStages = [
  "idea",
  "pre_company",
  "prototype",
  "pre_seed",
  "seed",
  "series_a",
  "series_b",
  "series_c_plus",
  "growth",
  "mature",
  "buyout_ready",
] as const;
export type CompanyStage = (typeof companyStages)[number];
export const capitalForms = [
  "equity",
  "safe",
  "convertible_note",
  "loan",
  "credit_line",
  "venture_debt",
  "grant",
  "subsidy",
] as const;
export const resourceTypes = [
  "Enterprise distribution",
  "Technical expertise",
  "Recruiting",
  "Overseas expansion",
  "Manufacturing",
  "Regulatory support",
  "Office space",
  "Cloud credits",
  "GPU compute",
  "Mentorship",
  "Legal support",
  "Founder network",
  "Investor network",
  "Fundraising support",
  "Customer introductions",
] as const;
export const policyIds = [
  "incubator",
  "accelerator",
  "angel",
  "vc_pre_seed",
  "vc_seed",
  "vc_growth",
  "private_equity",
  "bank",
  "program",
  "strategic",
] as const;
export type PolicyId = (typeof policyIds)[number];
export const policyCategories: Record<PolicyId, readonly Category[]> = {
  incubator: ["incubator"],
  accelerator: ["accelerator"],
  angel: ["angel"],
  vc_pre_seed: ["venture_capital", "corporate_vc"],
  vc_seed: ["venture_capital", "corporate_vc"],
  vc_growth: ["venture_capital", "corporate_vc"],
  private_equity: ["private_equity"],
  bank: ["bank", "venture_debt"],
  program: [
    "government_fund",
    "industrial_fund",
    "grant",
    "subsidy",
    "university_fund",
    "family_office",
    "crowdfunding",
  ],
  strategic: ["strategic_investor", "corporate_vc"],
};
export const legacyCategories: Record<string, Category> = {
  Angel: "angel",
  VC: "venture_capital",
  PE: "private_equity",
  Bank: "bank",
  Incubator: "incubator",
  Accelerator: "accelerator",
  "Industrial fund": "industrial_fund",
  "Policy fund": "government_fund",
  "Strategic investor": "strategic_investor",
  "Family office": "family_office",
};
export const legacyStages: Record<string, CompanyStage> = {
  "Pre-seed": "pre_seed",
  Seed: "seed",
  "Series A": "series_a",
  Growth: "growth",
  Mature: "mature",
};
