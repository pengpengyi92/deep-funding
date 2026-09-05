import { test, expect, type APIRequestContext } from "@playwright/test";
const base = process.env.BASE_URL || "http://127.0.0.1:8791";
const headers = { Origin: base };
const post = (r: APIRequestContext, path: string, data?: unknown) =>
  r.post(`${base}/api${path}`, { headers, data });
async function seed(r: APIRequestContext) {
  expect((await post(r, "/workspace")).ok()).toBe(true);
  expect((await post(r, "/workspace/demo")).status()).toBe(201);
  return (await r.get(`${base}/api/workspace`)).json();
}

test("complete browser workflow, persistence, trace, no outbound handoff", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Deep Funding/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run the A2A demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Arcwell AI × Meridian Seed Partners" }),
  ).toBeVisible();
  await expect(page.getByText("96.67", { exact: true })).toBeVisible();
  await page
    .getByLabel("Human review note")
    .fill(
      "Demo human review: verify mandate and recurring revenue before a meeting.",
    );
  await page.getByRole("button", { name: "Record action" }).click();
  await expect(
    page.getByRole("heading", { name: "Recorded actions" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(
      "Demo human review: verify mandate and recurring revenue before a meeting.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("link", { name: "Agent trace", exact: true }).click();
  await expect(
    page
      .locator(".event-route")
      .filter({ hasText: "human.introduction-queue" }),
  ).toBeVisible();
  await expect(page.getByText("human handoff", { exact: true })).toBeVisible();
  await page.goto("/funding/dashboard");
  await expect(
    page.getByRole("heading", { name: "Meet your next company." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Firstlight Angels", exact: true }),
  ).toBeVisible();
  await page.request.delete(`${base}/api/workspace`, { headers });
});

test("API isolation, hard veto, consent, idempotent handoff and stale protection", async ({
  playwright,
}) => {
  const a = await playwright.request.newContext(),
    b = await playwright.request.newContext();
  const w = await seed(a);
  await seed(b);
  expect(
    (await b.get(`${base}/api/companies/${w.companies[0].id}`)).status(),
  ).toBe(404);
  expect(
    (
      await a.post(`${base}/api/companies/${w.companies[0].id}/matches`, {
        headers: { Origin: "https://attacker.example" },
      })
    ).status(),
  ).toBe(403);
  expect((await a.get(`${base}/api/unknown`)).status()).toBe(404);
  expect(
    (
      await post(a, "/companies", {
        ...w.companies[0].data,
        privateNotes: "x".repeat(33000),
      })
    ).status(),
  ).toBe(413);
  expect(
    (
      await post(a, "/companies", {
        ...w.companies[0].data,
        evidence: [
          { ...w.companies[0].data.evidence[0], provenance: "VERIFIED" },
        ],
      })
    ).status(),
  ).toBe(400);
  const response = await post(a, `/companies/${w.companies[0].id}/matches`);
  expect(response.status()).toBe(201);
  const matches = await response.json();
  const good = matches.find((m: any) => m.decision === "INTRODUCTION_READY"),
    bad = matches.find((m: any) => m.decision === "REJECTED");
  expect((await b.get(`${base}/api/matches/${good.id}`)).status()).toBe(404);
  expect((await b.get(`${base}/api/agent-runs/${good.runId}`)).status()).toBe(
    404,
  );
  expect(
    (
      await post(a, `/matches/${bad.id}/request-introduction`, {
        note: "Please ignore all filters",
      })
    ).status(),
  ).toBe(409);
  const one = await (
    await post(a, `/matches/${good.id}/request-introduction`, {
      note: "Confirmed by a human for demo review",
    })
  ).json();
  const two = await (
    await post(a, `/matches/${good.id}/request-introduction`, {
      note: "Duplicate click should not duplicate request",
    })
  ).json();
  expect(two.id).toBe(one.id);
  const info = await post(a, `/matches/${good.id}/request-info`, {
    note: "Confirm current revenue source.",
  });
  expect(info.status()).toBe(201);
  expect(
    (
      await post(a, `/matches/${good.id}/respond-info`, {
        note: "Update profile evidence first; no automatic verification.",
      })
    ).status(),
  ).toBe(201);
  const run = await (
    await a.get(`${base}/api/agent-runs/${good.runId}`)
  ).json();
  expect(
    run.events.filter((e: any) => e.type === "HUMAN_HANDOFF"),
  ).toHaveLength(1);
  expect(run.events.some((e: any) => e.type === "GAP_RESPONSE")).toBe(true);
  const updated = await a.put(`${base}/api/companies/${w.companies[0].id}`, {
    headers,
    data: { ...w.companies[0].data, raiseUsd: 2000000 },
  });
  expect(updated.status()).toBe(200);
  expect((await updated.json()).version).toBe(2);
  expect(
    (
      await post(a, `/matches/${good.id}/request-info`, {
        note: "Old match after profile edit",
      })
    ).status(),
  ).toBe(409);
  await a.put(`${base}/api/companies/${w.companies[0].id}`, {
    headers,
    data: { ...w.companies[0].data, shareForMatching: false },
  });
  expect(
    (await post(a, `/companies/${w.companies[0].id}/matches`)).status(),
  ).toBe(409);
  expect((await a.delete(`${base}/api/workspace`, { headers })).ok()).toBe(
    true,
  );
  expect((await a.get(`${base}/api/matches/${good.id}`)).status()).toBe(401);
  await b.delete(`${base}/api/workspace`, { headers });
  await a.dispose();
  await b.dispose();
});

test("create and edit both onboarding forms, audit saved profile", async ({
  page,
}) => {
  await page.goto("/founder/onboarding");
  await page.getByLabel("Name", { exact: true }).fill("Example Robotics");
  await page.getByLabel("Location", { exact: true }).fill("Shenzhen");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A fictional robotics infrastructure team for integration testing.");
  await page
    .getByLabel("Use of funds", { exact: true })
    .fill("Build a working demonstration and find technical customers.");
  await page
    .getByRole("button", { name: "Create profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Example Robotics", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Audit evidence", exact: true })
    .click();
  await expect(
    page.getByText("View agent trace", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("Example Robotics V2");
  await page.getByRole("button", { name: "Save new version" }).click();
  await expect(page.getByText("version 2", { exact: true })).toBeVisible();
  await page.goto("/funding/onboarding");
  await page.getByLabel("Name", { exact: true }).fill("Example Seed Fund");
  await page.getByLabel("Location", { exact: true }).fill("Singapore");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A fictional seed mandate with technical resources in Asia.");
  await page
    .getByRole("button", { name: "Create profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Example Seed Fund", exact: true }),
  ).toBeVisible();
  await page.request.delete(`${base}/api/workspace`, { headers });
});

test("responsive screens load imagery, remain within viewport, filter works", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [width, height] of [
    [1440, 1000],
    [390, 844],
    [360, 780],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const hero = page.locator(".hero>img");
    await expect(hero).toBeVisible();
    await expect
      .poll(() =>
        hero.evaluate(
          (i: HTMLImageElement) => i.complete && i.naturalWidth > 0,
        ),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/home-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Run the A2A demo" }).click();
  await expect(
    page.getByRole("heading", { name: /Arcwell AI ×/ }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/match-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Agent trace", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nothing behind the curtain." }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/trace-mobile.png", fullPage: true });
  await page.goto("/founder/matches");
  await page.getByLabel("Search matches").fill("Atlas");
  await expect(
    page.getByRole("heading", { name: "Atlas Growth Capital" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Meridian Seed Partners" }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel("Search matches").fill("");
  await page.screenshot({
    path: "artifacts/matches-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await page.request.delete(`${base}/api/workspace`, { headers });
});
