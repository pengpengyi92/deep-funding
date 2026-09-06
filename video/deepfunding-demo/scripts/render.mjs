import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { start, root } from "./runtime.mjs";
import { writeScore } from "./audio.mjs";
import { DURATION, FPS, WIDTH, HEIGHT } from "../src/timeline.js";
const output = path.join(root, "output");
await fs.mkdir(output, { recursive: true });
const stills = process.argv.includes("--stills");
const stamps = [1.8, 5.5, 9.5, 14.5, 18.8, 21.1, 23, 26.6];
const started = Date.now();
const app = await start();
let ffmpeg;
try {
  const stats = [];
  for (const [i, t] of stamps.entries()) {
    stats.push(await app.page.evaluate((t) => window.film.seek(t), t));
    await app.page.screenshot({
      path: path.join(output, `shot-${String(i + 1).padStart(2, "0")}.png`),
    });
  }
  await fs.writeFile(
    path.join(output, "shot-states.json"),
    JSON.stringify(stats, null, 2),
  );
  if (app.errors.length) throw new Error(app.errors.join("\n"));
  console.log("8 storyboard frames captured.");
  if (!stills) {
    const wav = path.join(output, "original-score.wav");
    await writeScore(wav, DURATION);
    const mp4 = path.join(output, "deepfunding-demo.mp4");
    ffmpeg = spawn(
      process.env.FFMPEG_PATH || "ffmpeg",
      [
        "-hide_banner",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "image2pipe",
        "-framerate",
        String(FPS),
        "-vcodec",
        "mjpeg",
        "-i",
        "pipe:0",
        "-i",
        wav,
        "-vf",
        "scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p",
        "-color_range",
        "tv",
        "-colorspace",
        "bt709",
        "-color_primaries",
        "bt709",
        "-color_trc",
        "bt709",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-r",
        String(FPS),
        "-c:a",
        "aac",
        "-af",
        "loudnorm=I=-20:LRA=9:TP=-2",
        "-ar",
        "48000",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        "-t",
        String(DURATION),
        mp4,
      ],
      { windowsHide: true, stdio: ["pipe", "ignore", "pipe"] },
    );
    let encodeError = "";
    ffmpeg.stderr.on("data", (c) => (encodeError += c.toString()));
    let processError;
    ffmpeg.on("error", (e) => (processError = e));
    ffmpeg.stdin.on("error", (e) => (processError = e));
    const exit = new Promise((resolve) =>
      ffmpeg.once("close", (code) => resolve([code])),
    );
    for (let frame = 0; frame < DURATION * FPS; frame++) {
      if (processError) throw processError;
      if (ffmpeg.exitCode !== null)
        throw new Error(`ffmpeg stopped: ${encodeError}`);
      await app.page.evaluate((n) => window.film.frame(n), frame);
      const image = await app.page.screenshot({ type: "jpeg", quality: 97 });
      await new Promise((resolve, reject) => {
        const onClose = () => {
          cleanup();
          reject(new Error(`Encoder exited: ${encodeError}`));
        };
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("Encoder write timed out"));
        }, 30000);
        const cleanup = () => {
          clearTimeout(timer);
          ffmpeg.off("close", onClose);
        };
        ffmpeg.once("close", onClose);
        ffmpeg.stdin.write(image, (error) => {
          cleanup();
          error ? reject(error) : resolve();
        });
      });
      if (frame % 90 === 0)
        console.log(
          `Rendered ${frame}/${DURATION * FPS} frames (${Math.round((Date.now() - started) / 1000)}s).`,
        );
    }
    ffmpeg.stdin.end();
    const [code] = await exit;
    ffmpeg = undefined;
    if (code !== 0) throw new Error(encodeError);
    if (app.errors.length) throw new Error(app.errors.join("\n"));
    const bytes = await fs.readFile(mp4);
    const result = {
      artifact: "deepfunding-demo.mp4",
      created_at: new Date().toISOString(),
      duration_seconds: DURATION,
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
      frames: DURATION * FPS,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      render_wall_seconds: (Date.now() - started) / 1000,
      method:
        "Deterministic Three.js frames -> Playwright JPEG97 -> BT.709 limited H.264 CRF17 + original PCM synthesis -> loudnorm I-20 TP-2 -> AAC192",
      browser_errors: app.errors,
    };
    await fs.writeFile(
      path.join(output, "render-manifest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
} finally {
  if (ffmpeg) ffmpeg.kill();
  await app.close();
}
