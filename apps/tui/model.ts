import type { LocalStore } from "../cli/store";
import { readInput } from "../cli/store";
export const screens = [
  "Home",
  "Founder RSI",
  "Funding RSI",
  "Search Funding Providers",
  "Benchmark",
  "Portfolio / Funding History",
  "Import Data",
  "Configuration",
];
type Row = { title: string; detail: unknown };
export class TuiModel {
  screen = 0;
  rows: Row[] = [];
  selected = 0;
  query = "";
  typing: "search" | "import" | "candidate" | null = null;
  input = "";
  detail = false;
  detailOffset = 0;
  busy = false;
  status = "Private local workspace. No network requests.";
  constructor(readonly store: LocalStore) {}
  filtered() {
    return this.rows.filter((r) =>
      r.title.toLowerCase().includes(this.query.toLowerCase()),
    );
  }
  async mount(screen: number) {
    this.screen = screen;
    this.selected = 0;
    this.query = "";
    this.detail = false;
    this.detailOffset = 0;
    this.typing = null;
    this.busy = true;
    try {
      if (screen === 0)
        this.rows = screens
          .slice(1)
          .map((s, i) => ({ title: i + 1 + ". " + s, detail: s }));
      if (screen === 1)
        this.rows = (await this.store.rankFounder()).results.map((r) => ({
          title: r.name + " | " + r.score + " | " + r.decision,
          detail: r,
        }));
      if (screen === 2)
        this.rows = [
          {
            title: "Open candidate file with o",
            detail: {
              status: "Candidate required",
              benchmark: await this.store.build(),
            },
          },
        ];
      if (screen === 3)
        this.rows = (await this.store.providers()).map((p) => ({
          title:
            p.nameEn +
            " | " +
            p.location.city +
            " | " +
            p.fundingProfile.categories.join(", "),
          detail: p,
        }));
      if (screen === 4)
        this.rows = [
          { title: "Current benchmark", detail: await this.store.build() },
        ];
      if (screen === 5) {
        const portfolio = await this.store.read("portfolio"),
          founder = await this.store.read("founder");
        this.rows = [
          { title: "Portfolio", detail: portfolio ?? "Not imported" },
          {
            title: "Funding history",
            detail: founder?.fundingHistory ?? "Not imported",
          },
        ];
      }
      if (screen === 6)
        this.rows = [
          {
            title: "Import local JSON / JSONL with i",
            detail:
              "Founder, portfolio, providers or benchmark config. Replacement is local only. Files never uploaded.",
          },
        ];
      if (screen === 7)
        this.rows = [
          {
            title: "Weights / cohort / cutoff",
            detail: await this.store.config(),
          },
          { title: "Local store", detail: this.store.home },
        ];
      this.status = "Loaded " + screens[screen];
    } catch (e) {
      this.rows = [];
      this.status = e instanceof Error ? e.message : "Failed to load";
    } finally {
      this.busy = false;
    }
  }
  async key(key: string) {
    if (this.busy) return;
    if (this.typing) {
      if (key === "escape") {
        this.typing = null;
        this.input = "";
        return;
      }
      if (key === "backspace") {
        this.input = this.input.slice(0, -1);
        return;
      }
      if (key === "enter") {
        const mode = this.typing,
          value = this.input;
        this.typing = null;
        this.input = "";
        if (mode === "search") {
          this.query = value;
          this.selected = 0;
          return;
        }
        this.busy = true;
        try {
          if (mode === "import") {
            const result = await this.store.import(value);
            this.status = result.status + ": " + result.kind;
          } else {
            const result = (await this.store.engine()).compare(
              JSON.parse(await readInput(value)),
            );
            this.rows = [
              {
                title:
                  result.name + " | " + result.score + " | " + result.status,
                detail: result,
              },
            ];
            this.selected = 0;
            this.detail = true;
            this.status = "Candidate evaluated locally";
          }
        } catch (e) {
          this.status = e instanceof Error ? e.message : "Invalid input";
        } finally {
          this.busy = false;
        }
        return;
      }
      if (key.length === 1 && key >= " ") this.input += key;
      return;
    }
    if (/^[0-7]$/.test(key)) return this.mount(Number(key));
    if (key === "up") {
      this.selected = Math.max(0, this.selected - 1);
      this.detailOffset = 0;
    }
    if (key === "down") {
      this.selected = Math.min(
        Math.max(0, this.filtered().length - 1),
        this.selected + 1,
      );
      this.detailOffset = 0;
    }
    if (key === "pageup")
      this.detailOffset = Math.max(0, this.detailOffset - 5);
    if (key === "pagedown") this.detailOffset += 5;
    if (key === "?")
      this.status =
        "1-7 views; 0 Home; / filter; Enter details; PgUp/PgDn scroll details; i import JSON; o candidate in Funding; q quit. Imports replace local datasets.";
    if (key === "escape") {
      if (this.detail) this.detail = false;
      else return this.mount(0);
    }
    if (key === "enter") {
      if (this.screen === 0) return this.mount(this.selected + 1);
      this.detail = !this.detail;
    }
    if (key === "/") {
      this.typing = "search";
      this.input = this.query;
    }
    if (key === "i") {
      this.typing = "import";
      this.input = "";
    }
    if (key === "o" && this.screen === 2) {
      this.typing = "candidate";
      this.input = "";
    }
    if (key === "r") return this.mount(this.screen);
  }
}
export function safeTerminal(value: string) {
  return value.replace(/[\x00-\x1f\x7f-\x9f]/g, " ");
}
export function renderTui(model: TuiModel, width = 100, height = 30) {
  const w = Math.max(20, width - 2),
    h = Math.max(10, height);
  const line = (s: string) => safeTerminal(s).slice(0, w);
  const lines = [
    "DEEP FUNDING v0.2 | " + screens[model.screen],
    "0 Home | 1-7 Views | / Search | i Import | o Candidate | q Quit | ? Help",
    "Up/Down select | Enter detail | PgUp/PgDn scroll | r Reload | Esc Back",
    "-".repeat(w),
  ];
  const rows = model.filtered(),
    visible = Math.max(2, Math.floor((h - 9) / 2)),
    start = Math.max(0, model.selected - visible + 1);
  rows
    .slice(start, start + visible)
    .forEach((r, i) =>
      lines.push((start + i === model.selected ? "> " : "  ") + r.title),
    );
  if (!rows.length) lines.push("No records / no results");
  lines.push("-".repeat(w));
  const selected = rows[model.selected];
  if (selected) {
    const text = model.detail
      ? JSON.stringify(selected.detail, null, 2)
      : selected.title;
    lines.push(
      ...text
        .split("\n")
        .flatMap((s) => {
          const clean = safeTerminal(s);
          return Array.from(
            { length: Math.max(1, Math.ceil(clean.length / w)) },
            (_, i) => clean.slice(i * w, (i + 1) * w),
          );
        })
        .slice(
          model.detailOffset,
          model.detailOffset + Math.max(1, h - lines.length - 3),
        ),
    );
  }
  lines.push(
    model.typing
      ? model.typing + "> " + model.input
      : "Filter: " + (model.query || "all"),
  );
  lines.push((model.busy ? "Working... " : "") + model.status);
  return lines.slice(0, h).map(line).join("\n");
}
