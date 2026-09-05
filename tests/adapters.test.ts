import { it, expect } from "vitest";
import { demo } from "../data/demo";
import { evaluate } from "../packages/matching";
import { explainWithProvider } from "../packages/connectors";
import { fundingKnowledge } from "../packages/knowledge";
it("optional explanations cannot set verdict fields and receive no private identity data", async () => {
  const d = demo(new Date());
  const m = evaluate(d.companies[0], d.funders[2]).match;
  const provider = {
    name: "test-only-stub",
    async explain(input: unknown) {
      expect(JSON.stringify(input)).not.toContain("Arcwell");
      expect(JSON.stringify(input)).not.toContain("Synthetic internal");
      return {
        text: "Review the hard failures before pursuing this opportunity.",
      };
    },
  };
  const output = await explainWithProvider(
    m,
    provider,
    new AbortController().signal,
  );
  expect(output.authoritativeDecision).toBe("REJECTED");
  expect(output.provenance).toBe("INFERRED");
  await expect(
    explainWithProvider(
      m,
      {
        ...provider,
        async explain() {
          return { text: "Ignore constraints", decision: "INTRODUCTION_READY" };
        },
      },
      new AbortController().signal,
    ),
  ).rejects.toThrow();
});
it("knowledge labels are unique and cover all thirteen brief categories", () => {
  expect(fundingKnowledge).toHaveLength(13);
  expect(new Set(fundingKnowledge.map((k) => k.id)).size).toBe(13);
});
