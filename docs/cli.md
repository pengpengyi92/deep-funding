# CLI

Node 24, `npm ci`. Run `npm run cli -- --help` without a global install. Optional `npm link` exposes `deepfunding`; Windows users whose policy blocks npm PowerShell shims can use `deepfunding.cmd`. The npm package remains a source-checkout application, not a published registry package; keep development dependencies including tsx installed.

Every command group supports `--help`. `--json` outputs JSON and never opens a prompt. Exit 0 = success/help, 2 = invalid input, missing record/file, or rejected operation. JSON errors intentionally omit malformed source contents. Default output is pretty-printed structured data. `--home <directory>` or DEEPFUNDING_HOME sets the private store; default is `~/.deep-funding`, outside Git. No network client exists in CLI/TUI services.

```text
founder init | show | import <file>
funding list | search [--sector --stage --location --query] | show <id>
rsi founder run | rank | explain <provider-id>
rsi funding run --portfolio <file>
rsi funding score <company-file> | compare <company-file>
rsi funding update <record-file>
benchmark build | show | export <file>
data import <file> | validate <file>
tui
```

Inputs: strict JSON or provider JSONL, maximum 5 MiB. Import validates the entire dataset before atomic replacement of that dataset. `data validate` never writes. `founder init` creates a labelled synthetic starter and refuses to overwrite. Export refuses existing files and includes private source records/config, so choose a private destination. Concurrent writers are not coordinated; use one writer per private store until process locking is added.

Agent example: `deepfunding --home private_data/workspace rsi founder rank --json`. Do not put credentials in arguments. Unknown stages/locations do not satisfy search filters. Provider source URLs are citations only, never fetched or executed.
