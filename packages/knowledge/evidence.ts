import type { Evidence } from "../schemas";
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
