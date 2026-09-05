import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { demoConfig, demoPortfolio } from "../data/rsi-demo";
let home: string;
beforeAll(async () => {
  home = await mkdtemp(join(tmpdir(), "deepfunding-test-"));
});
afterAll(async () => {
  await rm(home, { recursive: true, force: true });
});
function run(...args: string[]) {
  const r = spawnSync(
    process.execPath,
    ["bin/deepfunding.mjs", "--home", home, ...args],
    { encoding: "utf8", timeout: 20000 },
  );
  return { ...r, json: () => JSON.parse(r.stdout) };
}
describe("CLI end to end", () => {
  it("help at every major level and strict JSON errors", () => {
    for (const args of [
      [],
      ["founder"],
      ["funding"],
      ["rsi", "founder"],
      ["rsi", "funding"],
      ["benchmark"],
      ["data"],
    ]) {
      const r = run(...args, "--help");
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("Usage:");
    }
    const bad = run("funding", "search", "--wat", "--json");
    expect(bad.status).toBe(2);
    expect(bad.json().error).toBeTruthy();
  }, 20000);
  it("runs the complete founder workflow locally", () => {
    expect(
      run(
        "founder",
        "import",
        "examples/founder_rsi/founder.json",
        "--json",
      ).json().status,
    ).toBe("IMPORTED_LOCALLY");
    expect(
      run("data", "import", "examples/founder_rsi/providers.json", "--json")
        .status,
    ).toBe(0);
    const search = run(
      "funding",
      "search",
      "--location",
      "shenzhen",
      "--sector",
      "AI",
      "--json",
    );
    expect(search.status).toBe(0);
    expect(search.json().length).toBeGreaterThan(0);
    expect(run("rsi", "founder", "run", "--json").json().results).toHaveLength(
      3,
    );
    expect(run("rsi", "founder", "rank", "--json").json().results).toHaveLength(
      3,
    );
    expect(
      run("rsi", "founder", "explain", "demo-frontier", "--json").json()
        .components,
    ).toHaveLength(3);
    expect(run("founder", "init", "--json").status).toBe(2);
  }, 20000);
  it("runs funding, cohort configuration, snapshot, export, stale rejection and feedback", async () => {
    expect(
      run(
        "rsi",
        "funding",
        "run",
        "--portfolio",
        "examples/funding_rsi/portfolio.json",
        "--json",
      ).status,
    ).toBe(0);
    expect(
      run(
        "rsi",
        "funding",
        "score",
        "examples/funding_rsi/candidate.json",
        "--json",
      ).json().score,
    ).toBeGreaterThan(0);
    expect(
      run(
        "rsi",
        "funding",
        "compare",
        "examples/funding_rsi/candidate.json",
        "--json",
      ).json().status,
    ).toBe("COMPARABLE");
    const out = join(home, "export.private.json");
    expect(run("benchmark", "export", out, "--json").status).toBe(0);
    expect(run("benchmark", "export", out, "--json").status).toBe(2);
    const config = join(home, "new-config.json");
    await writeFile(config, JSON.stringify({ ...demoConfig, percentile: 60 }));
    expect(run("data", "import", config, "--json").status).toBe(0);
    expect(run("benchmark", "show", "--json").status).toBe(2);
    expect(run("benchmark", "build", "--json").status).toBe(0);
    const record = join(home, "new-record.json");
    await writeFile(
      record,
      JSON.stringify({ ...demoPortfolio[0], id: "appended" }),
    );
    expect(
      run("rsi", "funding", "update", record, "--json").json().records,
    ).toBe(13);
    expect(run("rsi", "funding", "update", record, "--json").status).toBe(2);
  }, 20000);
  it("validates without import and never prompts in JSON/non-TTY mode", async () => {
    expect(
      run(
        "data",
        "validate",
        "data/funding_providers/china/shenzhen/providers.jsonl",
        "--json",
      ).json().records,
    ).toBe(0);
    const invalid = join(home, "bad.json");
    await writeFile(invalid, '{"privateSecret":"DO_NOT_ECHO",oops}');
    const r = run("data", "validate", invalid, "--json");
    expect(r.status).toBe(2);
    expect(r.stdout).not.toContain("DO_NOT_ECHO");
    expect(run("tui", "--json").status).toBe(2);
    expect(run("tui").status).toBe(2);
  }, 20000);
});
