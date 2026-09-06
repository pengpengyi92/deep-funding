import { test, expect } from "@playwright/test";

test("public graph APIs expose sourced knowledge, not private records", async ({
  request,
}) => {
  const funding = await (await request.get("/api/knowledge/funding")).json();
  const compliance = await (
    await request.get("/api/knowledge/compliance")
  ).json();
  expect(funding.records).toHaveLength(26);
  expect(compliance.records).toHaveLength(14);
  expect(
    funding.records.filter((r: any) => r.record_type === "entity"),
  ).toHaveLength(18);
  const mode = await (await request.get("/api/v3/health")).json();
  expect(mode.mode).toBe("public-knowledge");
  expect(mode.persistent).toBe(false);
  expect((await request.get("/api/v3/companies")).status()).toBe(503);
});

test("public funding source detail and mobile compliance view", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/knowledge/funding");
  await expect(page.getByText("18 sourced records")).toBeVisible();
  await page.getByLabel("category", { exact: true }).selectOption("bank");
  await expect(page.getByText("3 results", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /WeBank/ }).click();
  await expect(
    page.getByRole("article", { name: "Knowledge detail" }),
  ).toContainText("no collateral requirement");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/knowledge/compliance?id=xiaohongshu-disputed-2026");
  const detail = page.getByRole("article", { name: "Knowledge detail" });
  await expect(detail).toContainText("company statement");
  await expect(detail).toContainText("disputed / media report");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/v0.3-public-compliance-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("public database entry never automatically contacts localhost", async ({
  page,
}) => {
  const local: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes(":8793")) local.push(r.url());
  });
  await page.goto("/data-explorer");
  await expect(
    page.getByRole("heading", { name: "Private database is local" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open local database/ }),
  ).toHaveAttribute("href", "http://127.0.0.1:8793/data-explorer");
  expect(local).toEqual([]);
});
