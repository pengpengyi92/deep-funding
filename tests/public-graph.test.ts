import { describe, expect, it } from "vitest";
import {
  publicKnowledge,
  searchKnowledge,
} from "../packages/knowledge/public-graph";

describe("public knowledge graph boundary", () => {
  it("contains only public source notes and typed templates", () => {
    expect(publicKnowledge.length).toBe(40);
    expect(
      searchKnowledge("funding", new URLSearchParams("category=bank")),
    ).toHaveLength(3);
    expect(new Set(publicKnowledge.map((r) => r.id)).size).toBe(
      publicKnowledge.length,
    );
    for (const r of publicKnowledge) {
      expect(r.content_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(r.path).toMatch(/^(funding|compliance)-rag-graph\//);
      expect(
        r.related_ids.every((id) =>
          publicKnowledge.some((node) => node.id === id),
        ),
      ).toBe(true);
    }
  });
  it("keeps source type and company response for disputed case", () => {
    const disputed = searchKnowledge(
      "compliance",
      new URLSearchParams("status=disputed"),
    );
    expect(disputed).toHaveLength(1);
    expect(disputed[0].evidence_level).toBe("media_report");
    expect(disputed[0].claims.some((c) => c.type === "company_statement")).toBe(
      true,
    );
    expect(
      disputed[0].claims.some((c) => c.type === "regulatory_finding"),
    ).toBe(false);
  });
  it("allows category, geography, company and keyword filtering", () => {
    expect(
      searchKnowledge("funding", new URLSearchParams("location=Shenzhen"))
        .length,
    ).toBe(18);
    expect(
      searchKnowledge("compliance", new URLSearchParams("company=Xiaohongshu")),
    ).toHaveLength(1);
    expect(
      searchKnowledge("funding", new URLSearchParams("q=nonexistent!")),
    ).toHaveLength(0);
  });
});
