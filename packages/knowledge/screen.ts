import type { Company, Dimension } from "../schemas";
import type { FundingProfile } from "./profile-schema";
import { acceptsProvider, acceptsStage } from "./adapter";
import { stageOf } from "./readiness";
import { policyFor, type PolicyDimension } from "./policies";
import { usableEvidence } from "./evidence";

export function screenFunding(
  c: Company,
  p: FundingProfile,
  now = new Date(),
  override?: Record<string, number>,
) {
  const policy = policyFor(p.policy_id);
  const weights = override || policy.weights;
  const failures: string[] = [],
    gaps: string[] = [];
  const refs = (field: string) =>
    c.evidence
      .filter((e) => e.field === field && usableEvidence(e, now))
      .map((e) => `company:${e.id}`);
  const has = (field: string) => refs(field).length > 0;
  const stage = stageOf(c);
  if (stage === null || p.target_stages === null)
    gaps.push("Stage or target stages are unknown.");
  else if (!acceptsStage(c, p))
    failures.push(`Stage: ${stage} is outside ${p.target_stages.join(" / ")}.`);
  if (p.geographies === null) gaps.push("Geographic eligibility is unknown.");
  else if (
    !p.geographies.includes("Global") &&
    !p.geographies.includes(c.region)
  )
    failures.push(`Geography: ${c.region} is outside the mandate.`);
  if (!acceptsProvider(c, p))
    failures.push("Company does not accept any of this provider's categories.");
  if (p.exclusions === null) gaps.push("Provider exclusions are unknown.");
  else if (p.exclusions.includes(c.sector))
    failures.push(`Sector ${c.sector} is explicitly excluded.`);
  const coverage = c.strategicNeeds.length
    ? new Set(c.strategicNeeds.filter((r) => p.provides.includes(r))).size /
      new Set(c.strategicNeeds).size
    : 0;
  if (c.resourceOnly) {
    if (!c.strategicNeeds.length || coverage === 0)
      failures.push("No requested non-capital resource is provided.");
  } else if (p.provides_capital === false)
    failures.push(
      "This entity offers resources only; it cannot satisfy the cash request.",
    );
  else if (p.provides_capital === null || p.ticket_usd === null)
    gaps.push("Capital availability or ticket is unknown.");
  else if (c.raiseUsd < p.ticket_usd.min || c.raiseUsd > p.ticket_usd.max)
    failures.push(
      "Requested single-provider ticket is outside the mandate range.",
    );
  const req = p.company_requirements;
  const revenue =
    policy.financialGate &&
    c.financials?.annualRevenueUsd !== null &&
    c.financials?.annualRevenueUsd !== undefined
      ? c.financials.annualRevenueUsd > 0
      : c.mrrUsd === null
        ? null
        : c.mrrUsd > 0;
  for (const [key, value] of [
    ["product", c.workingProduct],
    ["technical_team", c.technicalTeam],
    ["traction", c.customers === null ? null : c.customers > 0],
    ["revenue", revenue],
  ] as const) {
    if (req[key] === "unknown")
      gaps.push(`Provider ${key} requirement is unknown.`);
    if (req[key] === "required" && value === null)
      gaps.push(`${key} requirement is unresolved.`);
    if (req[key] === "required" && value === false)
      failures.push(`Required ${key} is not reported.`);
  }
  if (req.minimum_mrr_usd !== null && req.minimum_mrr_usd > 0) {
    if (c.mrrUsd === null)
      gaps.push("MRR is unknown; revenue constraint cannot be checked.");
    else if (c.mrrUsd < req.minimum_mrr_usd)
      failures.push(`Monthly revenue is below USD ${req.minimum_mrr_usd}.`);
  }
  const fields = new Set([...policy.evidence, ...p.evidence_required]);
  if (req.product === "required") fields.add("product");
  if (req.technical_team === "required") fields.add("team");
  if (
    req.traction === "required" ||
    (req.revenue === "required" && !policy.financialGate)
  )
    fields.add("traction");
  for (const field of fields)
    if (!has(field))
      gaps.push(
        `Current, shared ${field} evidence is missing (180-day policy).`,
      );
  if (
    fields.has("traction") &&
    ((!policy.financialGate && c.mrrUsd === null) || c.customers === null)
  )
    gaps.push("One or more traction facts are unknown.");
  if (c.mrrUsd !== null && c.mrrUsd > 0 && c.customers === 0)
    gaps.push("Positive MRR with zero customers needs reconciliation.");
  const fin = c.financials;
  const financialComplete =
    !!fin &&
    fin.statementsAvailable === true &&
    fin.annualRevenueUsd !== null &&
    fin.operatingCashFlowUsd !== null &&
    fin.debtUsd !== null &&
    has("financials");
  const debtService = fin?.annualDebtServiceUsd;
  const repayment =
    financialComplete &&
    !!fin?.repaymentSource &&
    debtService !== null &&
    debtService !== undefined &&
    fin!.operatingCashFlowUsd! > 0 &&
    fin!.operatingCashFlowUsd! >= debtService;
  if (policy.financialGate && !financialComplete)
    gaps.push(
      "Financial statements, annual revenue, operating cash flow and debt need current shared evidence.",
    );
  if (p.policy_id === "bank") {
    if (!repayment)
      gaps.push(
        "Repayment source and positive cash flow covering reported debt service are unresolved; proposed loan terms still require underwriting.",
      );
    if (
      fin?.operatingCashFlowUsd !== null &&
      fin?.operatingCashFlowUsd !== undefined &&
      fin.operatingCashFlowUsd <= 0
    )
      failures.push(
        "Ordinary cash-flow lending policy requires positive operating cash flow. Special credit programs need a separate policy.",
      );
  }
  if (
    ["private_equity", "vc_growth"].includes(p.policy_id) &&
    c.mrrUsd === 0 &&
    (!fin || fin.annualRevenueUsd === null || fin.annualRevenueUsd === 0)
  )
    failures.push(
      "Default growth/buyout policy does not underwrite a pre-revenue company; special situations require a separate policy.",
    );
  const values: Record<PolicyDimension, [number, string, string[]]> = {
    Stage: [
      acceptsStage(c, p) ? 1 : 0,
      `${stage ?? "unknown"}; targets: ${p.target_stages?.join(", ") ?? "unknown"}. Financing history is separate.`,
      [],
    ],
    Sector: [
      p.industries?.includes(c.sector) || p.industries?.includes("All") ? 1 : 0,
      `Preferred sector: ${c.sector}; exclusions remain binding.`,
      [],
    ],
    Ticket: [
      c.resourceOnly
        ? 0
        : p.provides_capital === true &&
            p.ticket_usd &&
            c.raiseUsd >= p.ticket_usd.min &&
            c.raiseUsd <= p.ticket_usd.max
          ? 1
          : 0,
      c.resourceOnly
        ? "Not applicable to resource-only request; no cash-ticket points awarded."
        : `Single-provider cash request USD ${c.raiseUsd}; not syndicate funding.`,
      [],
    ],
    Geography: [
      p.geographies?.includes("Global") || p.geographies?.includes(c.region)
        ? 1
        : 0,
      `${c.region}; legal and program eligibility are not inferred.`,
      [],
    ],
    Traction: [
      has("traction")
        ? (Number((c.customers ?? 0) > 0) + Number((c.mrrUsd ?? 0) > 0)) / 2
        : 0,
      "Reported customer validation and positive MRR, supported by current shared evidence. Not growth or retention measurement.",
      refs("traction"),
    ],
    Team: [
      has("team") &&
      (p.policy_id === "vc_seed" || p.policy_id === "strategic"
        ? c.technicalTeam === true
        : c.teamSize > 0)
        ? 1
        : 0,
      "Documented team; seed-demo policy additionally scores technical capability. No founder-quality inference.",
      refs("team"),
    ],
    Product: [
      has("product") && c.workingProduct === true ? 1 : 0,
      "Working product with current evidence; a missing product is not a universal rejection.",
      refs("product"),
    ],
    Strategic: [
      coverage,
      `${Math.round(coverage * 100)}% of requested resources covered; no needs specified earns zero.`,
      [],
    ],
    Financials: [
      financialComplete ? 1 : 0,
      "Financial disclosure completeness, not an audited valuation or an assessment of financial quality.",
      refs("financials"),
    ],
    Repayment: [
      repayment ? 1 : 0,
      "Positive reported operating cash flow covers reported annual debt service; proposed terms and collateral still require human underwriting.",
      refs("financials"),
    ],
  };
  const dimensions: Dimension[] = Object.entries(weights).map(
    ([name, weight]) => {
      const [value, reason, evidenceRefs] = values[name as PolicyDimension];
      return {
        name,
        weight: weight!,
        value,
        points: Math.round(value * weight! * 100) / 100,
        reason,
        evidenceRefs,
      };
    },
  );
  return {
    policyId: p.policy_id,
    failures,
    gaps: [...new Set(gaps)],
    dimensions,
    score: Math.round(dimensions.reduce((n, d) => n + d.points, 0) * 100) / 100,
  };
}
