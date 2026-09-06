import { createServer } from "vite";
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export async function start() {
  const server = await createServer({
    root,
    server: { host: "127.0.0.1", port: 5198, strictPort: false },
  });
  await server.listen();
  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    await server.close();
    throw error;
  }
  const port = server.httpServer.address().port;
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(String(e));
    console.error(String(e));
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
      console.error(msg.text());
    }
  });
  try {
    await page.goto(`http://127.0.0.1:${port}/?render=1`);
    await page.waitForFunction(
      () => window.film?.ready,
      {},
      { timeout: 30000 },
    );
    await page.evaluate(() => document.fonts.ready);
  } catch (error) {
    await browser.close();
    await server.close();
    throw new Error(`${error.message}\n${errors.join("\n")}`);
  }
  return {
    page,
    browser,
    server,
    errors,
    url: `http://127.0.0.1:${port}/`,
    close: async () => {
      await browser.close();
      await server.close();
    },
  };
}
