import type { Company, Funder, Audit, Analysis, Evidence } from "../schemas";
import { fundingReadiness, stageOf } from "../knowledge/readiness";
import { fundingProfileOf, acceptsProvider } from "../knowledge/adapter";
import { screenFunding } from "../knowledge/screen";
import { usableEvidence } from "../knowledge/evidence";
export { usableEvidence } from "../knowledge/evidence";

export const ENGINE_VERSION = "rules-2.0.0";
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
  analysis(p: Company, now = new Date()): Analysis {
    return {
      readiness: fundingReadiness(p, now),
      summary: `${stageOf(p) ?? "Unknown stage"} ${p.sector} company seeking ${p.resourceOnly ? "non-capital resources" : `USD ${p.raiseUsd.toLocaleString("en-US")}`} through ${p.acceptedCategories?.join(" / ") || p.capitalTypes.join(" / ")}.`,
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
  audit(p: Company, now: Date, f?: Funder): Audit {
    if (f) {
      const result = auditEvidence(p, [], now);
      result.gaps.push(...screenFunding(p, fundingProfileOf(f), now).gaps);
      result.status = result.gaps.length ? "GAPS" : "REVIEWABLE";
      return result;
    }
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
    const categories = fundingProfileOf(f).categories;
    return {
      accepted: acceptsProvider(p, fundingProfileOf(f)),
      summary: acceptsProvider(p, fundingProfileOf(f))
        ? `${categories.join(" / ")} includes an accepted provider category; capital and resources are checked separately.`
        : `Company does not accept ${categories.join(" / ")} providers.`,
    };
  },
};
export const fundingAgents = {
  information(p: Funder) {
    if (p.fundingProfile)
      return shared({
        ...p,
        evidence: p.fundingProfile.source_metadata.sources.map((s, i) => ({
          id: `catalogue-source-${i}`,
          field: "mandate" as const,
          label: s.claims.join("; ").slice(0, 250),
          source: s.url,
          observedAt: s.accessed_at,
          visibility: "PUBLIC" as const,
          provenance: "PROVIDED" as const,
        })),
      });
    return shared(p);
  },
  analysis(p: Funder): Analysis {
    const k = fundingProfileOf(p);
    return {
      summary: `${k.categories.join(" / ")}; policy ${k.policy_id}; target stages ${k.target_stages?.join(" / ") ?? "unknown"}; ${k.provides_capital === false ? "resources only" : "capital terms require review"}.`,
      strengths: [
        `Preference: ${k.industries?.join(", ") || "unknown"}.`,
        ...k.provides.map((r) => `${r} reported.`),
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
    if (p.fundingProfile) {
      const k = p.fundingProfile;
      const recent = k.source_metadata.sources.some((s) => {
        const age = now.getTime() - new Date(s.accessed_at).getTime();
        return (
          age >= 0 && age <= 180 * 86400000 && s.claims.includes("mandate")
        );
      });
      const gaps = [
        ...(!p.shareForMatching
          ? ["Profile sharing consent is disabled."]
          : []),
        ...(k.source_metadata.status === "scaffold"
          ? [
              "Catalogue scaffold is incomplete and cannot authorize an introduction.",
            ]
          : []),
        ...(!recent ? ["Current, sourced mandate evidence is missing."] : []),
      ];
      return {
        status: gaps.length ? "GAPS" : "REVIEWABLE",
        gaps,
        warnings: [
          "Source claims and policy scores are not independently verified. Terms and authority require human review.",
          ...(k.source_metadata.status === "synthetic"
            ? ["Fictional fixture; no real investment opportunity."]
            : []),
        ],
        evidence: [],
      };
    }
    return auditEvidence(p, ["mandate"], now);
  },
  match(c: Company, f: Funder, now = new Date()) {
    const { failures, gaps } = screenFunding(c, fundingProfileOf(f), now);
    return {
      failures,
      gaps,
      summary: failures.length
        ? "Funding-side hard constraints failed."
        : "Funding-side known hard constraints pass; evidence and unknowns still apply.",
    };
  },
};
