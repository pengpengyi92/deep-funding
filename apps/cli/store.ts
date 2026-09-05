import { writeFile, mkdir, rename, lstat, rm, open } from "node:fs/promises";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import {
  founderSchema,
  portfolioSchema,
  benchmarkConfigSchema,
  type Provider,
} from "../../packages/benchmark/schemas";
import { BenchmarkEngine } from "../../packages/benchmark/engine";
import {
  parseData,
  providersFromCatalogue,
  founderRSI,
  parseProviders,
} from "../../packages/services/rsi";
import { demoConfig, demoFounder } from "../../data/rsi-demo";

export const MAX_BYTES = 5 * 1024 * 1024;
export async function readInput(file: string) {
  const handle = await open(file, "r");
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > MAX_BYTES)
      throw new Error("Input must be a regular file no larger than 5 MiB");
    const text = await handle.readFile("utf8");
    if (Buffer.byteLength(text) > MAX_BYTES)
      throw new Error("Input exceeds 5 MiB");
    return text;
  } finally {
    await handle.close();
  }
}
export class LocalStore {
  readonly home: string;
  constructor(
    home = process.env.DEEPFUNDING_HOME || join(homedir(), ".deep-funding"),
  ) {
    this.home = resolve(home);
  }
  async read(name: string) {
    try {
      return JSON.parse(await readInput(join(this.home, name + ".json")));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
  async write(name: string, value: unknown) {
    if (!/^[a-z-]+$/.test(name)) throw new Error("Invalid store key");
    await mkdir(this.home, { recursive: true, mode: 0o700 });
    if ((await lstat(this.home)).isSymbolicLink())
      throw new Error("Private home must not be a symlink");
    const tmp = join(this.home, ".tmp-" + randomUUID());
    try {
      await writeFile(tmp, JSON.stringify(value, null, 2) + "\n", {
        mode: 0o600,
        flag: "wx",
      });
      await rename(tmp, join(this.home, name + ".json"));
    } finally {
      await rm(tmp, { force: true });
    }
  }
  async founder() {
    const value = await this.read("founder");
    if (!value)
      throw new Error(
        "Import a founder first: deepfunding founder import <file>",
      );
    return founderSchema.parse(value);
  }
  async initFounder() {
    if (await this.read("founder"))
      throw new Error("Founder already exists; init will not overwrite it");
    await this.write("founder", demoFounder);
    return {
      status: "CREATED_SYNTHETIC_TEMPLATE",
      path: join(this.home, "founder.json"),
      warning: "Edit/import your own facts before use",
    };
  }
  async providers(): Promise<Provider[]> {
    const value = await this.read("providers");
    return value
      ? parseProviders(JSON.stringify(value))
      : providersFromCatalogue();
  }
  async config() {
    return benchmarkConfigSchema.parse(
      (await this.read("config")) ?? demoConfig,
    );
  }
  async portfolio() {
    const value = await this.read("portfolio");
    if (!value)
      throw new Error(
        "Import a portfolio first: deepfunding rsi funding run --portfolio <file>",
      );
    return portfolioSchema.parse(value);
  }
  async import(file: string, expected?: string) {
    const data = parseData(await readInput(file));
    if (expected && data.kind !== expected)
      throw new Error("Expected " + expected + ", received " + data.kind);
    await this.write(
      data.kind === "providers" ? "providers" : data.kind,
      data.value,
    );
    return {
      status: "IMPORTED_LOCALLY",
      kind: data.kind,
      records: Array.isArray(data.value) ? data.value.length : 1,
      networkRequests: 0,
    };
  }
  async rankFounder() {
    return founderRSI(
      await this.founder(),
      await this.providers(),
      await this.config(),
    );
  }
  async engine() {
    return BenchmarkEngine.fit(await this.portfolio(), await this.config());
  }
  async build() {
    const engine = await this.engine();
    await this.write("benchmark", engine.export());
    return {
      version: engine.version,
      records: engine.records.length,
      asOf: engine.config.asOf,
      mode: engine.config.mode,
    };
  }
  async snapshot() {
    const value = await this.read("benchmark");
    if (!value) throw new Error("Build a benchmark first");
    const engine = await this.engine();
    if (value.version !== engine.version)
      throw new Error(
        "Benchmark is stale after data/config change; rebuild before export",
      );
    return engine.export();
  }
}
