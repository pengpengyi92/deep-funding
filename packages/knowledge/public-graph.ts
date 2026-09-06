import data from "../../data/knowledge-public.json";

export type KnowledgeRecord = (typeof data.records)[number];
export const publicKnowledge = data.records;
export function searchKnowledge(kind: string, params: URLSearchParams) {
  return publicKnowledge.filter((row) => {
    if (row.kind !== kind) return false;
    for (const key of [
      "q",
      "category",
      "stage",
      "industry",
      "location",
      "company",
      "jurisdiction",
      "status",
      "evidence_level",
      "risk_tags",
    ] as const) {
      const value = params.get(key)?.toLowerCase();
      if (!value) continue;
      if (key === "q") {
        if (!JSON.stringify(row).toLowerCase().includes(value)) return false;
      } else {
        const field = row[key];
        if (
          Array.isArray(field)
            ? !field.some((v) => String(v).toLowerCase() === value)
            : String(field).toLowerCase() !== value
        )
          return false;
      }
    }
    return true;
  });
}
