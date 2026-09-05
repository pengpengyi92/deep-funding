import { z } from "zod";
import type { Match, Evidence } from "../schemas";

// Future connectors return observations, never silently VERIFIED claims.
export interface CompanyDataProvider {
  name: string;
  search(
    query: string,
    signal: AbortSignal,
  ): Promise<{ externalId: string; name: string }[]>;
  profile(
    externalId: string,
    signal: AbortSignal,
  ): Promise<{ name: string; evidence: Evidence[] }>;
  shareholders(externalId: string, signal: AbortSignal): Promise<Evidence[]>;
  legalRecords(externalId: string, signal: AbortSignal): Promise<Evidence[]>;
  financialSignals(
    externalId: string,
    signal: AbortSignal,
  ): Promise<Evidence[]>;
}

export type ExplanationInput = Pick<
  Match,
  "score" | "decision" | "dimensions" | "hardFailures" | "gaps" | "nextAction"
>;
export interface ExplanationProvider {
  name: string;
  explain(
    input: Readonly<ExplanationInput>,
    signal: AbortSignal,
  ): Promise<unknown>;
}
const explanationSchema = z
  .object({ text: z.string().trim().min(1).max(2000) })
  .strict();
/** Optional annotation only: the model never returns or changes a verdict. */
export async function explainWithProvider(
  match: Match,
  provider: ExplanationProvider,
  signal: AbortSignal,
) {
  const input: ExplanationInput = structuredClone({
    score: match.score,
    decision: match.decision,
    dimensions: match.dimensions,
    hardFailures: match.hardFailures,
    gaps: match.gaps,
    nextAction: match.nextAction,
  });
  const output = explanationSchema.parse(await provider.explain(input, signal));
  return {
    provider: provider.name,
    provenance: "INFERRED" as const,
    requiresHumanReview: true,
    text: output.text,
    authoritativeDecision: match.decision,
  };
}
