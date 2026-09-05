import {
  companyAgents,
  fundingAgents,
  ENGINE_VERSION,
  usableEvidence,
} from "../agents";
import { createRun, emit } from "../a2a";
import type { Company, Funder, Profile, Match, Dimension } from "../schemas";

export const defaultWeights = {
  Stage: 25,
  Sector: 20,
  Ticket: 15,
  Geography: 10,
  Traction: 10,
  Team: 10,
  Strategic: 10,
};
export type Weights = typeof defaultWeights;
export function compareMatches(a: Match, b: Match): number {
  const priority = {
    INTRODUCTION_READY: 0,
    REQUEST_MORE_INFORMATION: 1,
    LOW_FIT: 2,
    REJECTED: 3,
  };
  return (
    priority[a.decision] - priority[b.decision] ||
    b.score - a.score ||
    a.funderName.localeCompare(b.funderName) ||
    a.companyName.localeCompare(b.companyName)
  );
}
export function evaluate(
  company: Profile<Company>,
  funder: Profile<Funder>,
  now = new Date(),
  weights: Weights = defaultWeights,
) {
  if (
    Object.values(weights).some((w) => !Number.isFinite(w) || w < 0) ||
    Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 100) > 1e-8
  )
    throw new Error("Weights must be finite, nonnegative and sum to 100");
  if (!company.data.shareForMatching || !funder.data.shareForMatching)
    throw new Error("Both profiles must consent to matching");
  const c = companyAgents.information(company.data),
    f = fundingAgents.information(funder.data);
  const ca = companyAgents.analysis(c),
    fa = fundingAgents.analysis(f),
    cu = companyAgents.audit(c, now),
    fu = fundingAgents.audit(f, now);
  const cp = companyAgents.match(c, f),
    fp = fundingAgents.match(c, f);
  const hardFailures = [...fp.failures, ...(!cp.accepted ? [cp.summary] : [])];
  const gaps = [...new Set([...cu.gaps, ...fu.gaps, ...fp.gaps])];
  const evidence = [
    ...c.evidence.map((e) => ({ ...e, id: `company:${e.id}` })),
    ...f.evidence.map((e) => ({ ...e, id: `funder:${e.id}` })),
  ];
  const refs = (field: string) =>
    evidence
      .filter(
        (e) =>
          e.field === field &&
          e.id.startsWith(field === "mandate" ? "funder:" : "company:") &&
          usableEvidence(e, now),
      )
      .map((e) => e.id);
  const fact = (field: string) => refs(field).length > 0;
  const dimensions: Dimension[] = [];
  const dim = (
    name: keyof Weights,
    value: number,
    reason: string,
    evidenceRefs: string[],
  ) =>
    dimensions.push({
      name,
      weight: weights[name],
      value,
      points: Math.round(value * weights[name] * 100) / 100,
      reason,
      evidenceRefs,
    });
  dim(
    "Stage",
    f.stages.includes(c.stage) ? 1 : 0,
    `${c.stage}; mandate: ${f.stages.join(", ")}`,
    refs("mandate"),
  );
  dim(
    "Sector",
    f.sectors.includes(c.sector) ? 1 : 0,
    `${c.sector}; preferred sectors: ${f.sectors.join(", ")}`,
    refs("mandate"),
  );
  dim(
    "Ticket",
    c.raiseUsd >= f.ticketMinUsd && c.raiseUsd <= f.ticketMaxUsd ? 1 : 0,
    `USD ${c.raiseUsd}; single-provider ticket assumption (not total syndicate round).`,
    refs("mandate"),
  );
  dim(
    "Geography",
    f.regions.includes("Global") || f.regions.includes(c.region) ? 1 : 0,
    `${c.region}; no cross-border eligibility implied.`,
    refs("mandate"),
  );
  const traction = fact("traction")
    ? (Number(c.customers !== null && c.customers > 0) +
        Number(c.mrrUsd !== null && c.mrrUsd > 0)) /
      2
    : 0;
  dim(
    "Traction",
    traction,
    "Demo policy: current shared evidence plus reported customers and positive MRR (5 points each).",
    refs("traction"),
  );
  dim(
    "Team",
    fact("team") && c.technicalTeam === true ? 1 : 0,
    "Demo policy: technical founding team with current shared evidence.",
    refs("team"),
  );
  const coverage = c.strategicNeeds.length
    ? c.strategicNeeds.filter((r) => f.strategicResources.includes(r)).length /
      c.strategicNeeds.length
    : 0;
  dim(
    "Strategic",
    coverage,
    `${Math.round(coverage * 100)}% of requested resources covered; no needs specified earns zero, not a free score.`,
    refs("mandate"),
  );
  const score =
    Math.round(dimensions.reduce((n, d) => n + d.points, 0) * 100) / 100;
  const decision: Match["decision"] = hardFailures.length
    ? "REJECTED"
    : gaps.length
      ? "REQUEST_MORE_INFORMATION"
      : score >= 75
        ? "INTRODUCTION_READY"
        : "LOW_FIT";
  const nextAction =
    decision === "REJECTED"
      ? "Resolve the mandate mismatch or choose another counterparty."
      : decision === "REQUEST_MORE_INFORMATION"
        ? "Add current, shared source evidence or resolve unknown facts, then rerun."
        : decision === "LOW_FIT"
          ? "Review the low-fit dimensions before spending time on outreach."
          : "Human review of fit and claims, then record an introduction request. No contact is automatic.";
  const run = createRun(now);
  emit(
    run,
    "PROFILE_READY",
    "company.information",
    "company.analysis",
    `Company profile v${company.version} normalized.`,
    { profileId: company.id, version: company.version },
    c.evidence.map((e) => `company:${e.id}`),
  );
  emit(
    run,
    "PROFILE_READY",
    "funding.information",
    "funding.analysis",
    `Funding mandate v${funder.version} normalized.`,
    { profileId: funder.id, version: funder.version },
    refs("mandate"),
  );
  emit(run, "ANALYSIS_READY", "company.analysis", "company.audit", ca.summary, {
    strengths: ca.strengths,
    risks: ca.risks,
  });
  emit(run, "ANALYSIS_READY", "funding.analysis", "funding.audit", fa.summary, {
    strengths: fa.strengths,
    risks: fa.risks,
  });
  emit(
    run,
    "AUDIT_READY",
    "company.audit",
    "company.match",
    `Company audit: ${cu.status}.`,
    { gaps: cu.gaps, warnings: cu.warnings },
  );
  emit(
    run,
    "AUDIT_READY",
    "funding.audit",
    "funding.match",
    `Funding audit: ${fu.status}.`,
    { gaps: fu.gaps, warnings: fu.warnings },
  );
  emit(run, "MATCH_REQUEST", "company.match", "funding.match", cp.summary, {
    requestedTicketUsd: c.raiseUsd,
    acceptedCapitalTypes: c.capitalTypes,
  });
  emit(run, "MATCH_RESPONSE", "funding.match", "company.match", fp.summary, {
    hardFailures,
    dimensions,
    score,
  });
  if (gaps.length)
    emit(
      run,
      "GAP_REQUEST",
      "match.layer",
      "human",
      `${gaps.length} unresolved evidence gaps.`,
      { gaps },
    );
  emit(run, "MATCH_DECISION", "match.layer", "human", decision, {
    score,
    decision,
    nextAction,
    hardFiltersOverrideScore: true,
  });
  const match: Match = {
    id: crypto.randomUUID(),
    companyId: company.id,
    funderId: funder.id,
    companyName: c.name,
    funderName: f.name,
    companyVersion: company.version,
    funderVersion: funder.version,
    createdAt: now.toISOString(),
    runId: run.id,
    score,
    decision,
    hardFailures,
    gaps,
    warnings: [...new Set([...cu.warnings, ...fu.warnings])],
    dimensions,
    companyAnalysis: ca,
    funderAnalysis: fa,
    companyAudit: cu,
    funderAudit: fu,
    companyPerspective: cp.summary,
    funderPerspective: fp.summary,
    nextAction,
    evidenceSnapshot: evidence,
    engineVersion: ENGINE_VERSION,
  };
  return { match, run };
}
