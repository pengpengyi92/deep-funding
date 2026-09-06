import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { start, root } from "./runtime.mjs";
await fs.mkdir(path.join(root, "output"), { recursive: true });
const app = await start(),
  checks = [];
try {
  for (const t of [1.8, 5.5, 9.5, 14.5, 18.8, 21.1, 23, 26.6]) {
    const state = await app.page.evaluate((t) => window.film.seek(t), t);
    const pixels = await app.page.evaluate(() => {
      const src = document.querySelector("#world"),
        canvas = document.createElement("canvas");
      canvas.width = 192;
      canvas.height = 108;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(src, 0, 0, 192, 108);
      const data = ctx.getImageData(0, 0, 192, 108).data;
      let sum = 0,
        sq = 0,
        n = 0;
      for (let i = 0; i < data.length; i += 4) {
        let v = (data[i] + data[i + 1] + data[i + 2]) / 3;
        sum += v;
        sq += v * v;
        n++;
      }
      return { mean: sum / n, variance: sq / n - (sum / n) ** 2 };
    });
    assert.ok(pixels.variance > 200, `nonblank at ${t}`);
    assert.equal(state.agentCount, 53);
    if (t === 9.5) assert.ok(state.companyOpacity < 0.2);
    if (t === 18.8) assert.ok(state.fundingOpacity < 0.2);
    if (t === 21.1) assert.equal(state.selectedLinks, 3);
    checks.push({ time: t, ...pixels, ...state });
  }
  await app.page.evaluate(() => window.film.seek(14));
  const a = await app.page.locator("#world").screenshot();
  await app.page.evaluate(() => window.film.seek(14.5));
  const b = await app.page.locator("#world").screenshot();
  assert.notEqual(
    createHash("sha256").update(a).digest("hex"),
    createHash("sha256").update(b).digest("hex"),
  );
  await app.page.setViewportSize({ width: 390, height: 844 });
  await app.page.goto(app.url);
  await app.page.waitForFunction(() => window.film?.ready);
  await app.page.getByRole("button", { name: "Pause", exact: true }).click();
  await app.page.locator("#scrub").focus();
  await app.page.locator("#scrub").press("Home");
  await app.page.locator("#scrub").press("ArrowRight");
  assert.ok(await app.page.evaluate(() => window.film.getState().time > 0.03));
  await app.page.evaluate(() => window.film.seek(21.1));
  const bounds = await app.page.locator("#film").boundingBox();
  assert.ok(Math.abs(bounds.width / bounds.height - 16 / 9) < 0.02);
  assert.equal(
    await app.page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await app.page.screenshot({
    path: path.join(root, "output", "mobile-preview.png"),
  });
  await app.page.getByRole("button", { name: "Restart", exact: true }).click();
  assert.equal(await app.page.evaluate(() => window.film.getState().time), 0);
  await app.page.getByRole("button", { name: "Play", exact: true }).click();
  await app.page.waitForFunction(() => window.film.getState().time > 0.2);
  assert.equal(app.errors.length, 0, app.errors.join("\n"));
  const result = {
    timestamp: new Date().toISOString(),
    checks,
    desktop_canvas_nonblank: true,
    motion: true,
    mobile_aspect_ratio: true,
    no_horizontal_overflow: true,
    play_pause_seek_restart: true,
    browser_errors: app.errors,
  };
  await fs.writeFile(
    path.join(root, "output", "verification.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(
    "Passed: 8 scenes, nonblank canvas, motion, cutaways, top-3 matching, mobile framing, preview controls.",
  );
} finally {
  await app.close();
}
