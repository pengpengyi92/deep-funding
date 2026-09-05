import { demo } from "./demo";
import type { Company, Profile } from "../packages/schemas";
import { categories } from "../packages/knowledge/taxonomy";
export function taxonomyCompanies(now = new Date()): Profile<Company>[] {
  const base = demo(now).companies[0];
  const make = (
    id: string,
    name: string,
    patch: Partial<Company>,
  ): Profile<Company> => ({
    ...structuredClone(base),
    id,
    data: {
      ...structuredClone(base.data),
      name,
      acceptedCategories: [...categories],
      capitalTypes: [
        "Incubator",
        "Accelerator",
        "Angel",
        "VC",
        "PE",
        "Bank",
        "Policy fund",
        "Strategic investor",
        "Family office",
        "Industrial fund",
      ],
      ...patch,
    },
  });
  const financials: Company["financials"] = {
    annualRevenueUsd: 12000000,
    operatingCashFlowUsd: 2000000,
    debtUsd: 1000000,
    annualDebtServiceUsd: 400000,
    repaymentSource: "Fictional recurring operating cash receipts",
    statementsAvailable: true,
  };
  const financialEvidence = {
    ...base.data.evidence[0],
    id: "financial-fixture",
    field: "financials" as const,
    label: "Fictional financial disclosure",
    source: "Synthetic financial statements, not a real company",
  };
  return [
    make("idea-founder", "Idea-stage founder (fictional)", {
      companyStage: "idea",
      financingRound: "none",
      resourceOnly: true,
      raiseUsd: 0,
      workingProduct: false,
      mrrUsd: 0,
      customers: 0,
      strategicNeeds: ["Mentorship", "Office space"],
      evidence: base.data.evidence.filter((e) => e.field === "team"),
    }),
    make("preseed-ai", "AI Agent MVP (fictional)", {
      companyStage: "pre_seed",
      financingRound: "none",
      raiseUsd: 300000,
      workingProduct: true,
      teamSize: 2,
      mrrUsd: 0,
      customers: 5,
      strategicNeeds: ["Mentorship", "Founder network", "Technical expertise"],
    }),
    make("growth-company", "Growth company (fictional)", {
      companyStage: "growth",
      financingRound: "series_b",
      raiseUsd: 2000000,
      mrrUsd: 1000000,
      financials,
      evidence: [...base.data.evidence, financialEvidence],
    }),
    make("mature-company", "Bootstrapped mature company (fictional)", {
      companyStage: "mature",
      financingRound: "none",
      raiseUsd: 1000000,
      mrrUsd: 1000000,
      financials,
      evidence: [...base.data.evidence, financialEvidence],
    }),
  ];
}
