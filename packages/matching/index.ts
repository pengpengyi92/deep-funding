import {
  companyAgents,
  fundingAgents,
  ENGINE_VERSION,
  usableEvidence,
} from "../agents";
import { createRun, emit } from "../a2a";
import type { Company, Funder, Profile, Match } from "../schemas";
import { fundingProfileOf } from "../knowledge/adapter";
import { screenFunding } from "../knowledge/screen";

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
export function matchIsStale(
  m: Match,
  companyVersion: number | undefined,
  funderVersion: number | undefined,
  now = new Date(),
): boolean {
  return (
    m.engineVersion !== ENGINE_VERSION ||
    companyVersion !== m.companyVersion ||
    funderVersion !== m.funderVersion ||
    m.createdAt.slice(0, 10) !== now.toISOString().slice(0, 10)
  );
}
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
  weights?: Weights,
) {
  if (
    weights &&
    (Object.values(weights).some((w) => !Number.isFinite(w) || w < 0) ||
      Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 100) > 1e-8)
  )
    throw new Error("Weights must be finite, nonnegative and sum to 100");
  if (!company.data.shareForMatching || !funder.data.shareForMatching)
    throw new Error("Both profiles must consent to matching");
  const c = companyAgents.information(company.data),
    f = fundingAgents.information(funder.data);
  const ca = companyAgents.analysis(c, now),
    fa = fundingAgents.analysis(f),
    cu = companyAgents.audit(c, now, f),
    fu = fundingAgents.audit(f, now);
  const cp = companyAgents.match(c, f),
    fp = fundingAgents.match(c, f, now);
  const hardFailures = [...new Set(fp.failures)];
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
  const assessment = screenFunding(c, fundingProfileOf(f), now, weights);
  const { dimensions, score } = assessment;
  for (const dimension of dimensions) {
    if (!dimension.evidenceRefs.length)
      dimension.evidenceRefs = refs("mandate");
  }
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
    policyId: assessment.policyId,
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
    warnings: [
      ...new Set([
        ...cu.warnings,
        ...fu.warnings,
        "Policy scores are not calibrated across funding categories and are not funding probabilities.",
      ]),
    ],
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
    policyId: assessment.policyId,
  };
  return { match, run };
}
