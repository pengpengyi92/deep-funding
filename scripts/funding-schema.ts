import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { z } from "zod";
import { fundingProfileShape } from "../packages/knowledge/profile-schema";
const expected =
  JSON.stringify(z.toJSONSchema(fundingProfileShape), null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync("schemas/funding_profile.schema.json", "utf8") !== expected)
    throw new Error(
      "Funding JSON Schema is stale. Run npm run schema:generate.",
    );
} else {
  mkdirSync("schemas", { recursive: true });
  writeFileSync("schemas/funding_profile.schema.json", expected);
}
