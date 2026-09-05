import { beforeAll, afterAll, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStore } from "../apps/cli/store";
import { TuiModel, renderTui, safeTerminal } from "../apps/tui/model";
import { demoFounder, demoPortfolio, demoProviders } from "../data/rsi-demo";
let home: string, model: TuiModel;
beforeAll(async () => {
  home = await mkdtemp(join(tmpdir(), "deepfunding-tui-"));
  const store = new LocalStore(home);
  await store.write("founder", demoFounder);
  await store.write("portfolio", demoPortfolio);
  await store.write("providers", demoProviders);
  model = new TuiModel(store);
});
afterAll(async () => {
  await rm(home, { recursive: true, force: true });
});
it("mounts all seven screens through keyboard navigation", async () => {
  await model.mount(0);
  expect(renderTui(model)).toContain("DEEP FUNDING v0.2");
  for (let i = 1; i <= 7; i++) {
    await model.key(String(i));
    expect(model.screen).toBe(i);
    expect(model.rows.length).toBeGreaterThan(0);
    expect(model.status).toContain("Loaded");
  }
});
it("supports search, details, home navigation and escape", async () => {
  await model.mount(3);
  await model.key("/");
  for (const c of "frontier") await model.key(c);
  await model.key("enter");
  expect(model.filtered()).toHaveLength(1);
  await model.key("enter");
  expect(model.detail).toBe(true);
  expect(renderTui(model)).toContain("demo-frontier");
  await model.key("escape");
  await model.key("escape");
  expect(model.screen).toBe(0);
  await model.key("down");
  await model.key("enter");
  expect(model.screen).toBe(2);
});
it("imports candidate and exposes a real Funding RSI comparison", async () => {
  await model.mount(2);
  await model.key("o");
  for (const c of "examples/funding_rsi/candidate.json") await model.key(c);
  await model.key("enter");
  expect(model.status).toContain("evaluated locally");
  expect(model.rows[0].title).toContain("COMPARABLE");
});
it("clips to terminal dimensions and strips control sequences from untrusted text", () => {
  expect(safeTerminal("bad\u001b]52;abc\u0007")).not.toContain("\u001b");
  const lines = renderTui(model, 40, 16).split("\n");
  expect(lines.length).toBeLessThanOrEqual(16);
  expect(lines.every((l) => l.length <= 38)).toBe(true);
});
