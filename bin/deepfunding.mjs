#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const result = spawnSync(process.execPath,["--import",import.meta.resolve("tsx"),fileURLToPath(new URL("../apps/cli/index.ts",import.meta.url)),...process.argv.slice(2)],{stdio:"inherit"});
if(result.error) process.stderr.write("Unable to start Deep Funding: " + result.error.message + "\n");
process.exitCode=result.status??1;
