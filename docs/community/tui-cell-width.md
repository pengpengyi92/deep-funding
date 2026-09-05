# [TUI] Add Unicode terminal-cell-aware wrapping

## Context
The readline TUI is functional and strips control characters, but current clipping counts JavaScript characters. CJK and emoji cell widths vary across terminals.

## Scope
Use a maintained cell-width/grapheme utility for row/detail wrapping. Preserve keyboard search, scrolling, status and terminal restoration. Add an 80x24 and 100x30 terminal matrix.

## Non-goals
No terminal framework rewrite, scoring changes, network imports or arbitrary ANSI passthrough.

## Acceptance Criteria
- CJK, combining characters and emoji do not overwrite borders/status.
- q/help remain visible at 80 columns.
- Control sequences from provider text remain inert.

## Tests and Files
apps/tui/model.ts, tests/tui.test.ts and docs/tui.md. Add display-cell boundary snapshots and preserve all CLI/business tests.
