import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 980 },
  });
  await page.goto(
    process.env.PREVIEW_URL || "http://127.0.0.1:5197/watch.html",
  );
  await page.waitForFunction(
    () => document.querySelector("video").readyState >= 2,
  );
  const metadata = await page.locator("video").evaluate((v) => ({
    duration: v.duration,
    width: v.videoWidth,
    height: v.videoHeight,
    codec: v.canPlayType('video/mp4; codecs="avc1.640028"'),
  }));
  if (
    metadata.duration !== 28 ||
    metadata.width !== 1920 ||
    metadata.height !== 1080
  )
    throw new Error(JSON.stringify(metadata));
  await page.locator("video").evaluate((v) => {
    v.muted = true;
    return v.play();
  });
  await page.waitForFunction(
    () => document.querySelector("video").currentTime > 0.2,
  );
  await page.locator("video").evaluate((v) => {
    v.pause();
    v.currentTime = 21.1;
  });
  await page.waitForFunction(() => {
    const v = document.querySelector("video");
    return (
      !v.seeking && v.readyState >= 2 && Math.abs(v.currentTime - 21.1) < 0.15
    );
  });
  await page.locator("video").evaluate(
    (v) =>
      new Promise((resolve) => {
        v.requestVideoFrameCallback(resolve);
        v.play();
      }),
  );
  await page.locator("video").evaluate((v) => v.pause());
  const variance = await page.locator("video").evaluate((v) => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 36;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0, 64, 36);
    const pixels = ctx.getImageData(0, 0, 64, 36).data;
    let sum = 0,
      squares = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      sum += pixels[i];
      squares += pixels[i] ** 2;
    }
    return squares / (pixels.length / 4) - (sum / (pixels.length / 4)) ** 2;
  });
  if (variance < 100) throw new Error("Blank video after seeking");
  await page.screenshot({ path: "output/watch-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "output/watch-mobile.png" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  if (overflow) throw new Error("Mobile overflow");
  await fs.writeFile(
    "output/playback-verification.json",
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        browser: "Chrome",
        metadata,
        playback: true,
        seek: true,
        frame_variance: variance,
        mobile_no_overflow: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "Chrome MP4 metadata, playback, seeking and mobile sizing passed.",
  );
} finally {
  await browser.close();
}
