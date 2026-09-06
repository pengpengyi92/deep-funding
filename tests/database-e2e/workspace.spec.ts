import { test, expect } from "@playwright/test";

test("browser form saves a private profile and survives refresh", async ({
  page,
}) => {
  const suffix = Date.now().toString();
  await page.goto("/data-explorer");
  await expect(page.getByText("SQLite / persistent")).toBeVisible();
  await page.getByRole("button", { name: /^users \(/ }).click();
  await page.getByRole("button", { name: "New record", exact: true }).click();
  await page
    .getByLabel("email", { exact: true })
    .fill(`browser${suffix}@example.invalid`);
  await page
    .getByLabel("name", { exact: true })
    .fill("Browser synthetic owner");
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Record saved to local database.",
  );
  await page.getByRole("button", { name: /^companies \(/ }).click();
  await page.getByRole("button", { name: "New record", exact: true }).click();
  await page
    .getByLabel("owner user id", { exact: true })
    .selectOption({ label: "Browser synthetic owner" });
  await page
    .getByLabel("company name", { exact: true })
    .fill("Browser Research " + suffix);
  await page
    .getByLabel("company stage", { exact: true })
    .selectOption("pre_seed");
  await page.getByLabel("industry", { exact: true }).fill("ai");
  await page.getByLabel("location", { exact: true }).fill("Shenzhen");
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByRole("table")).toContainText(
    "Browser Research " + suffix,
  );
  await page.reload();
  await page.getByLabel("Search records", { exact: true }).fill(suffix);
  await expect(page.getByRole("table")).toContainText(
    "Browser Research " + suffix,
  );
  await page
    .getByRole("button", { name: /^Inspect / })
    .first()
    .click();
  await expect(
    page.getByRole("region", { name: "Record detail" }),
  ).toContainText('"annual_revenue": null');
});

test("provider form and saved Agent match trace", async ({ page }) => {
  const suffix = Date.now().toString();
  await page.goto("/data-explorer");
  await page.getByRole("button", { name: /^funding providers \(/ }).click();
  await page.getByRole("button", { name: "New record", exact: true }).click();
  await page
    .getByLabel("owner user id", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByLabel("name", { exact: true })
    .fill("Browser Synthetic Fund " + suffix);
  await page.getByLabel("provider type", { exact: true }).selectOption("angel");
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByRole("table")).toContainText(
    "Browser Synthetic Fund " + suffix,
  );
  await page
    .getByLabel("Match company", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByLabel("Match provider", { exact: true })
    .selectOption({ label: "Browser Synthetic Fund " + suffix });
  await page
    .getByRole("button", { name: "Generate match", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Record detail" }),
  ).toContainText("funding_retrieval");
  await expect(
    page.getByRole("region", { name: "Record detail" }),
  ).toContainText("compliance_retrieval");
  await page.getByRole("button", { name: /^agent runs \(/ }).click();
  await expect(page.getByRole("table")).toContainText("A2A Match Agent");
});

test("private data stays local and layouts remain bounded", async ({
  page,
}) => {
  const remote: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1")) remote.push(r.url());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/data-explorer");
  await expect(page.getByText("SQLite / persistent")).toBeVisible();
  await page.screenshot({
    path: "artifacts/v0.3-database-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/v0.3-database-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(remote).toEqual([]);
});

test("funding knowledge filters and source detail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/knowledge/funding");
  await expect(page.getByText("18 sourced records")).toBeVisible();
  await page.getByLabel("category", { exact: true }).selectOption("bank");
  await expect(
    page.getByRole("button", { name: /Ping An Bank/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /WeBank/ }).click();
  await expect(
    page.getByRole("article", { name: "Knowledge detail" }),
  ).toContainText("no collateral requirement");
  await page.screenshot({
    path: "artifacts/v0.3-funding-knowledge.png",
    fullPage: true,
  });
  await page.getByLabel("Reset filters", { exact: true }).click();
  await page.getByLabel("Search knowledge").fill("no-such-entry");
  await expect(page.getByText("No records match these filters.")).toBeVisible();
});

test("disputed case retains response on desktop and mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/knowledge/compliance?id=xiaohongshu-disputed-2026");
  const detail = page.getByRole("article", { name: "Knowledge detail" });
  await expect(detail).toContainText("company statement");
  await expect(detail).toContainText("disputed / media report");
  await expect(
    detail.getByRole("link", { name: "Caixin original reporting" }),
  ).toHaveAttribute("href", /caixin.com/);
  await page.screenshot({
    path: "artifacts/v0.3-compliance-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/v0.3-compliance-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
