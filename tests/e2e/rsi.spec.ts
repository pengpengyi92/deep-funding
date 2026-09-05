import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
test("RSI local file import, both workflows, validation, export and zero data requests", async ({
  page,
}) => {
  await page.goto("/rsi");
  await expect(
    page.getByRole("heading", { name: "Your data. Your benchmark." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Run Founder RSI", exact: true })
    .click();
  await expect(
    page.getByText("HUMAN REVIEW", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Funding RSI", exact: true }).click();
  await page
    .getByRole("button", { name: "Run Funding RSI", exact: true })
    .click();
  await expect(page.getByText(/COMPARABLE · coverage/)).toBeVisible();
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page
    .getByLabel("Import RSI dataset")
    .setInputFiles("examples/funding_rsi/portfolio.json");
  await page
    .getByLabel("Import candidate", { exact: true })
    .setInputFiles("examples/funding_rsi/candidate.json");
  await page
    .getByRole("button", { name: "Run Funding RSI", exact: true })
    .click();
  await expect(page.getByText(/COMPARABLE · coverage/)).toBeVisible();
  await page
    .getByLabel("Cohort", { exact: true })
    .selectOption("sector_specific");
  await page.getByLabel("Sector", { exact: true }).fill("AI");
  await page
    .getByRole("button", { name: "Run Funding RSI", exact: true })
    .click();
  await expect(page.getByText(/COMPARABLE · coverage/)).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export private result", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("funding-rsi.private.json");
  await page
    .getByLabel("Import candidate", { exact: true })
    .setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"id":"bad"}'),
    });
  await expect(page.getByRole("alert")).toBeVisible();
  expect(requests).toEqual([]);
  await page.reload();
  await expect(
    page.getByText("Synthetic demonstration", { exact: true }),
  ).toBeVisible();
});
test("RSI responsive desktop tablet mobile and error-free rendering", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir("artifacts", { recursive: true });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/rsi");
    await page.getByRole("tab", { name: "Funding RSI", exact: true }).click();
    await page
      .getByRole("button", { name: "Run Funding RSI", exact: true })
      .click();
    await expect(page.getByText(/COMPARABLE · coverage/)).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "artifacts/rsi-" + width + ".png",
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
