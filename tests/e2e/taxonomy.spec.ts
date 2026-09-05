import { test, expect } from "@playwright/test";
const base = process.env.BASE_URL || "http://127.0.0.1:8791";
test("catalogue API, private preview, import and consent boundaries", async ({
  playwright,
}) => {
  const a = await playwright.request.newContext(),
    b = await playwright.request.newContext();
  const post = (path: string, data?: unknown) =>
    a.post(`${base}/api${path}`, { headers: { Origin: base }, data });
  try {
    const catalogue = await (
      await a.get(`${base}/api/funding-catalogue`)
    ).json();
    expect(catalogue.profiles).toHaveLength(15);
    expect((await a.get(`${base}/api/workspace`)).status()).toBe(401);
    expect((await a.get(`${base}/api/funding-schema`)).ok()).toBe(true);
    const p = await (
      await post("/funding-catalogue/y-combinator/preview", {
        exampleId: "preseed-ai",
      })
    ).json();
    expect(p.match.decision).toBe("REQUEST_MORE_INFORMATION");
    expect(p.handoffAllowed).toBe(false);
    expect(p.persisted).toBe(false);
    expect(
      (
        await post("/funding-catalogue/y-combinator/preview", {
          exampleId: "preseed-ai",
          companyId: "fake",
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await a.post(`${base}/api/funding-catalogue/y-combinator/preview`, {
          data: { exampleId: "preseed-ai" },
        })
      ).status(),
    ).toBe(403);
    await post("/workspace");
    const c = catalogue.examples[1].data;
    const own = await (
      await post("/companies", { ...c, privateNotes: "PRIVATE_MARKER" })
    ).json();
    expect(
      (
        await b.post(`${base}/api/funding-catalogue/y-combinator/preview`, {
          headers: { Origin: base },
          data: { companyId: own.id },
        })
      ).status(),
    ).toBe(401);
    const preview = await (
      await post("/funding-catalogue/demo-launchpad/preview", {
        companyId: own.id,
      })
    ).text();
    expect(preview).not.toContain("PRIVATE_MARKER");
    const imported = await (
      await post("/funding-catalogue/y-combinator/import")
    ).json();
    const again = await (
      await post("/funding-catalogue/y-combinator/import")
    ).json();
    expect(again.id).toBe(imported.id);
    const matches = await (await post(`/companies/${own.id}/matches`)).json();
    expect(matches[0].decision).toBe("REQUEST_MORE_INFORMATION");
    expect(
      (
        await post(`/matches/${matches[0].id}/request-introduction`, {
          note: "Attempt cannot override incomplete mandate",
        })
      ).status(),
    ).toBe(409);
    await a.put(`${base}/api/companies/${own.id}`, {
      headers: { Origin: base },
      data: { ...c, shareForMatching: false },
    });
    expect(
      (
        await post("/funding-catalogue/demo-launchpad/preview", {
          companyId: own.id,
        })
      ).status(),
    ).toBe(409);
  } finally {
    await a.delete(`${base}/api/workspace`, { headers: { Origin: base } });
    await a.dispose();
    await b.dispose();
  }
});

test("explorer search, multi-category profile, policy preview and workspace import", async ({
  page,
}) => {
  await page.goto("/funding/explorer");
  await expect(
    page.getByRole("heading", { name: "Funding Explorer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Y Combinator", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run preview", exact: true }).click();
  await expect(
    page.getByText(
      "Catalogue scaffold is incomplete and cannot authorize an introduction.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Incubators", exact: true }).click();
  await page.getByRole("button", { name: /Workshop Incubator/ }).click();
  await page
    .getByLabel("Company", { exact: true })
    .selectOption("example:idea-founder");
  await page.getByRole("button", { name: "Run preview", exact: true }).click();
  await expect(
    page
      .locator(".preview-result")
      .getByText("introduction ready", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search funding profiles").fill("no-such-entity");
  await expect(page.getByText("No matching profiles.")).toBeVisible();
  await page.getByLabel("Search funding profiles").fill("");
  await page.getByRole("button", { name: "Add to private workspace" }).click();
  await expect(
    page.getByRole("heading", { name: /Catalogue mandate/ }),
  ).toBeVisible();
  await expect(page.getByText("Resources only", { exact: true })).toBeVisible();
  await page.request.post(`${base}/api/funding-catalogue/y-combinator/import`, {
    headers: { Origin: base },
  });
  await page.goto("/funding/dashboard");
  await expect(page.getByText("Unknown ticket", { exact: true })).toBeVisible();
  await expect(page.getByText("Resources only", { exact: true })).toBeVisible();
  await expect(page.getByText("$0–$1", { exact: true })).toHaveCount(0);
  await page.request.delete(`${base}/api/workspace`, {
    headers: { Origin: base },
  });
});

test("explorer desktop and mobile framing", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/funding/explorer");
    await expect(
      page.getByRole("heading", { name: "Y Combinator", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Run preview", exact: true })
      .click();
    await expect(page.locator(".preview-result")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/funding-explorer-${width}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
