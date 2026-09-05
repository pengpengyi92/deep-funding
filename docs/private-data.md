# Local-First Privacy

RSI files stay in memory on the web or under `~/.deep-funding` in CLI/TUI. There is no RSI upload, analytics, remote inference or contact-sending path. The pre-existing A2A workspace is separate: its explicit create/import actions persist shared profiles in Cloudflare D1. Do not conflate private RSI with that sandbox.

Use `.local/`, `private_data/`, `user_data/` (ignored) or, preferably, directories outside this checkout. Do not save real documents into public funding/examples/docs directories. `.private.json` and `.private.jsonl` are ignored additional safeguards, not a data-loss prevention system. Review `git diff --cached` before publishing; ignore rules do not protect already-tracked files.

CLI store files request 0600 and directories 0700 on POSIX. Windows ACLs and disk encryption must be configured on the host; mode bits are not an encryption guarantee. Local exports are plain JSON. Sources/notes are inert data, no shell/template/URL execution. Browser rendering escapes strings and terminal rendering removes control characters.

Limits: a hosted web page must be trusted by the data owner; a future compromised frontend could read chosen files despite today's no-upload implementation. For highly sensitive portfolios use an audited offline checkout/CLI, restrict filesystem/network permissions and retain backups. Device access, synchronized folders and malicious extensions remain outside application guarantees. Tests check no browser request during RSI import/run/export and verify malformed JSON errors do not echo the source.
