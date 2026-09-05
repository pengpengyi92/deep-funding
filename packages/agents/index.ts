import type { Company, Funder, Audit, Analysis, Evidence } from "../schemas";

export const ENGINE_VERSION = "rules-1.0.0";
export function usableEvidence(e: Evidence, now: Date): boolean {
  const age = now.getTime() - new Date(e.observedAt).getTime();
  return (
    ["PUBLIC", "MATCH_ONLY"].includes(e.visibility) &&
    e.provenance === "PROVIDED" &&
    !!e.source.trim() &&
    age >= 0 &&
    age <= 180 * 86400000
  );
}
export function shared<T extends Company | Funder>(p: T): T {
  return {
    ...p,
    privateNotes: "",
    evidence: p.evidence.filter((e) =>
      ["PUBLIC", "MATCH_ONLY"].includes(e.visibility),
    ),
  };
}
function auditEvidence(
  p: Company | Funder,
  fields: Evidence["field"][],
  now: Date,
): Audit {
  const warnings = [
    "Provided claims are not independently verified. Audit is not legal or financial certification.",
  ];
  const gaps: string[] = [];
  if (!p.shareForMatching) gaps.push("Profile sharing consent is disabled.");
  for (const field of fields)
    if (!p.evidence.some((e) => e.field === field && usableEvidence(e, now)))
      gaps.push(
        `Current, shared ${field} evidence is missing (180-day policy).`,
      );
  const ids = p.evidence.map((e) => e.id);
  if (new Set(ids).size !== ids.length)
    gaps.push("Evidence IDs must be unique within the profile.");
  if (p.evidence.some((e) => !usableEvidence(e, now)))
    warnings.push(
      "Some evidence is stale, unknown, future-dated, source-free, or access-restricted; it cannot support a match.",
    );
  return {
    status: gaps.length ? "GAPS" : "REVIEWABLE",
    warnings,
    gaps,
    evidence: p.evidence.map((e) => ({
      id: e.id,
      provenance: e.provenance,
      usable: usableEvidence(e, now),
    })),
  };
}
export const companyAgents = {
  information(p: Company) {
    return shared(p);
  },
  analysis(p: Company): Analysis {
    return {
      summary: `${p.stage} ${p.sector} company seeking USD ${p.raiseUsd.toLocaleString("en-US")} through ${p.capitalTypes.join(" / ")}.`,
      strengths: [
        p.workingProduct === true
          ? "Working product reported."
          : "Product maturity needs investigation.",
        p.technicalTeam === true
          ? "Technical team reported."
          : "Team capability needs investigation.",
      ],
      risks: [
        "Revenue quality, retention, ownership and runway require human diligence.",
        ...(p.customers === 0 ? ["No customers reported."] : []),
        ...(p.mrrUsd === null ? ["Revenue is unknown, not zero."] : []),
      ],
      nextActions: [
        "Validate source evidence and its dates.",
        "Confirm instrument, valuation and use of funds in a meeting.",
      ],
    };
  },
  audit(p: Company, now: Date): Audit {
    const result = auditEvidence(p, ["team", "product", "traction"], now);
    if (
      p.mrrUsd === null ||
      p.customers === null ||
      p.workingProduct === null ||
      p.technicalTeam === null
    )
      result.gaps.push(
        "One or more product, team or traction facts are unknown.",
      );
    if (p.mrrUsd !== null && p.mrrUsd > 0 && p.customers === 0)
      result.gaps.push(
        "Positive MRR with zero customers needs reconciliation.",
      );
    result.status = result.gaps.length ? "GAPS" : "REVIEWABLE";
    return result;
  },
  match(p: Company, f: Funder) {
    return {
      accepted: p.capitalTypes.includes(f.capitalType),
      summary: p.capitalTypes.includes(f.capitalType)
        ? `${f.capitalType} is an accepted capital type; strategic needs are evaluated separately.`
        : `Company does not accept ${f.capitalType} capital.`,
    };
  },
};
export const fundingAgents = {
  information(p: Funder) {
    return shared(p);
  },
  analysis(p: Funder): Analysis {
    return {
      summary: `${p.capitalType} mandate: ${p.stages.join(" / ")} in ${p.regions.join(" / ")}; USD ${p.ticketMinUsd.toLocaleString("en-US")}-${p.ticketMaxUsd.toLocaleString("en-US")}.`,
      strengths: [
        `Preference: ${p.sectors.join(", ")}.`,
        ...p.strategicResources.map((r) => `${r} reported.`),
      ],
      risks: [
        "Fund availability, decision authority and mandate authenticity are not verified.",
      ],
      nextActions: [
        "Confirm current mandate with an authorized human.",
        "Review company fit against hard constraints before outreach.",
      ],
    };
  },
  audit(p: Funder, now: Date): Audit {
    return auditEvidence(p, ["mandate"], now);
  },
  match(c: Company, f: Funder) {
    const failures: string[] = [];
    const gaps: string[] = [];
    if (!f.stages.includes(c.stage))
      failures.push(`Stage: ${c.stage} is outside ${f.stages.join(" / ")}.`);
    if (!f.regions.includes("Global") && !f.regions.includes(c.region))
      failures.push(`Geography: ${c.region} is outside the mandate.`);
    if (c.raiseUsd < f.ticketMinUsd || c.raiseUsd > f.ticketMaxUsd)
      failures.push(
        "Requested single-provider ticket is outside the mandate range.",
      );
    if (f.excludedSectors.includes(c.sector))
      failures.push(`Sector ${c.sector} is explicitly excluded.`);
    if (c.mrrUsd === null && f.minimumMrrUsd > 0)
      gaps.push("MRR is unknown; revenue constraint cannot be checked.");
    else if (c.mrrUsd !== null && c.mrrUsd < f.minimumMrrUsd)
      failures.push(`Monthly revenue is below USD ${f.minimumMrrUsd}.`);
    if (f.requiresProduct && c.workingProduct === false)
      failures.push("A working product is required.");
    if (f.requiresProduct && c.workingProduct === null)
      gaps.push("Product requirement is unresolved.");
    if (f.requiresTechnicalTeam && c.technicalTeam === false)
      failures.push("A technical founding team is required.");
    if (f.requiresTechnicalTeam && c.technicalTeam === null)
      gaps.push("Technical team requirement is unresolved.");
    return {
      failures,
      gaps,
      summary: failures.length
        ? "Funding-side hard constraints failed."
        : "Funding-side known hard constraints pass; evidence and unknowns still apply.",
    };
  },
};
