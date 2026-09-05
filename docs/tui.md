# Terminal Workspace

Run `deepfunding tui` in an interactive terminal. Node readline drives a replaceable adapter over the same LocalStore/application services as the CLI. No benchmark logic is duplicated here.

Seven screens: Founder RSI, Funding RSI, Provider Search, Benchmark, Portfolio/History, Import, Configuration. Keyboard: 1-7 switch, 0 home, arrows select, Enter expand, Page Up/Down scroll detail, `/` search, `i` import a local file, `o` open candidate in Funding RSI, `r` reload, `?` help, Escape back, q/Ctrl-C exit. Cursor/raw/alternate-screen states are restored on normal exit.

Import founder/providers/portfolio/config first (CLI or screen 6). In Funding RSI, `o` accepts a candidate JSON path and displays a real cohort comparison. Configuration screen inspects current policy; import a validated config file with `i` to change it. Status/error feedback stays in the terminal.

Requires TTY; JSON/non-TTY use fails promptly and never waits for a prompt. Tests cover all screens, navigation, search, local candidate evaluation and control-character removal. Rows are conservatively character-clipped; CJK/wide grapheme cell accuracy and elaborate focus navigation remain bounded follow-ups. Recommended terminal is at least 100x30.
