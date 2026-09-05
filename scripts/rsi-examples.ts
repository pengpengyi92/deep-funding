import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import {
  demoConfig,
  demoFounder,
  demoPortfolio,
  demoProviders,
  demoCandidate,
} from "../data/rsi-demo";
import { providerSchema } from "../packages/benchmark/schemas";
const generated: Record<string, unknown> = {
  "examples/founder_rsi/founder.json": demoFounder,
  "examples/founder_rsi/providers.json": demoProviders,
  "examples/funding_rsi/portfolio.json": demoPortfolio,
  "examples/funding_rsi/candidate.json": demoCandidate,
  "examples/funding_rsi/config.json": demoConfig,
  "data/funding_providers/china/shenzhen/schema.json": z.toJSONSchema(
    providerSchema,
    { unrepresentable: "any" },
  ),
};
for (const [path, value] of Object.entries(generated)) {
  const text = JSON.stringify(value, null, 2) + "\n";
  if (process.argv.includes("--check")) {
    if ((await readFile(path, "utf8")) !== text)
      throw new Error("Stale generated example/schema: " + path);
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text);
  }
}
console.log(
  "RSI examples and structural schema verified; runtime refinements remain authoritative.",
);
