import { Command, CommanderError } from "commander";
import { writeFile } from "node:fs/promises";
import { ZodError } from "zod";
import { LocalStore, readInput } from "./store";
import { searchProviders, parseData } from "../../packages/services/rsi";
import { startTui } from "../tui/index";

const json = process.argv.includes("--json");
const output = (value: unknown): void => {
  process.stdout.write(
    JSON.stringify(value, null, json ? undefined : 2) + "\n",
  );
};
const cli = new Command()
  .name("deepfunding")
  .description("Local-first funding research. No contacts or data are sent.")
  .version("0.2.0")
  .option("--json", "Machine-readable output; never interactive")
  .option("--home <directory>", "Private local store (default ~/.deep-funding)")
  .exitOverride()
  .configureOutput({
    writeOut: (s) => (json ? output({ help: s }) : process.stdout.write(s)),
    writeErr: (s) => {
      if (!json) process.stderr.write(s);
    },
  });
const store = () => new LocalStore(cli.opts().home);
const founder = cli.command("founder").description("Local founder profile");
founder
  .command("init")
  .description("Create a clearly fictional editable template; never overwrite")
  .action(async () => output(await store().initFounder()));
founder
  .command("show")
  .description("Print the current private profile")
  .action(async () => output(await store().founder()));
founder
  .command("import <file>")
  .description("Validate and replace the private founder profile")
  .action(async (file) => output(await store().import(file, "founder")));
const funding = cli
  .command("funding")
  .description("Browse imported providers or the bundled taxonomy catalogue");
funding
  .command("list")
  .description("List providers")
  .action(async () =>
    output(
      (await store().providers()).map((p) => ({
        id: p.id,
        name: p.nameEn,
        location: p.location.city,
        categories: p.fundingProfile.categories,
        status: p.fundingProfile.source_metadata.status,
      })),
    ),
  );
funding
  .command("search")
  .description(
    "Search provider mandates and physical location; unknowns do not match filters",
  )
  .option("--sector <sector>")
  .option("--stage <stage>")
  .option("--location <location>")
  .option("--query <query>")
  .action(async (options) =>
    output(searchProviders(await store().providers(), options)),
  );
funding
  .command("show <id>")
  .description("Inspect a provider and its sources")
  .action(async (id) => {
    const p = (await store().providers()).find((p) => p.id === id);
    if (!p) throw new Error("Provider not found");
    output(p);
  });
const rsi = cli
  .command("rsi")
  .description("Explainable research scores, not predictions");
const fr = rsi.command("founder").description("Founder-to-provider ranking");
for (const name of ["run", "rank"])
  fr.command(name)
    .description("Recompute ranking with local profile, history and config")
    .action(async () => output(await store().rankFounder()));
fr.command("explain <provider-id>")
  .description("Explain one provider's gates and score components")
  .action(async (id) => {
    const result = (await store().rankFounder()).results.find(
      (r) => r.providerId === id,
    );
    if (!result) throw new Error("Provider not found");
    output(result);
  });
const pr = rsi.command("funding").description("Private portfolio benchmarks");
pr.command("run")
  .description("Import portfolio and build a versioned benchmark")
  .requiredOption("--portfolio <file>")
  .action(async (options) => {
    await store().import(options.portfolio, "portfolio");
    output(await store().build());
  });
for (const name of ["score", "compare"])
  pr.command(name + " <company-file>")
    .description(
      name === "score"
        ? "Score entry-time features"
        : "Compare with cohort and explain gaps",
    )
    .action(async (file) => {
      const engine = await store().engine();
      const input = JSON.parse(await readInput(file));
      output(name === "score" ? engine.score(input) : engine.compare(input));
    });
pr.command("update <record-file>")
  .description("Append one observation with a new ID; rebuild benchmark")
  .action(async (file) => {
    const s = store(),
      next = (await s.engine()).update(JSON.parse(await readInput(file)));
    await s.write("portfolio", next.records);
    output(await s.build());
  });
const benchmark = cli
  .command("benchmark")
  .description("Configure and snapshot the benchmark");
benchmark
  .command("build")
  .description("Rebuild the snapshot from current local inputs")
  .action(async () => output(await store().build()));
benchmark
  .command("show")
  .description("Inspect a current snapshot; reject stale snapshots")
  .action(async () => output(await store().snapshot()));
benchmark
  .command("export <file>")
  .description(
    "Explicitly export private records/config; existing files are not overwritten",
  )
  .action(async (file) => {
    const data = await store().snapshot();
    await writeFile(file, JSON.stringify(data, null, 2) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    output({ status: "EXPORTED_PRIVATE_DATA", version: data.version });
  });
const data = cli
  .command("data")
  .description("Strict JSON/JSONL ingestion; no automatic URL fetching");
data
  .command("import <file>")
  .description("Validate then replace the corresponding local dataset")
  .action(async (file) => output(await store().import(file)));
data
  .command("validate <file>")
  .description("Validate without writing or uploading")
  .action(async (file) => {
    const d = parseData(await readInput(file));
    output({
      valid: true,
      kind: d.kind,
      records: Array.isArray(d.value) ? d.value.length : 1,
    });
  });
cli
  .command("tui")
  .description("Open keyboard-first terminal workspace")
  .action(async () => {
    if (json)
      throw new Error("TUI is interactive; use rsi commands with --json");
    await startTui(store());
  });
function safeError(e: unknown) {
  if (e instanceof ZodError)
    return e.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ");
  if (e instanceof SyntaxError) return "Invalid JSON input";
  return e instanceof Error ? e.message : "Operation failed";
}
try {
  await cli.parseAsync(process.argv);
} catch (e) {
  if (e instanceof CommanderError && e.exitCode === 0) {
    /* help/version already printed */
  } else {
    const message = safeError(e);
    if (json) output({ error: { code: "INVALID_INPUT", message } });
    else process.stderr.write("Error: " + message + "\n");
    process.exitCode = 2;
  }
}
