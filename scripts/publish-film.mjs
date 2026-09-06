import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = `${root}/video/deepfunding-demo/output/deepfunding-demo.mp4`;
const target = `${root}/apps/web/public/film`;
mkdirSync(target, { recursive: true });
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    source,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "copy",
    "-movflags",
    "+faststart",
    `${target}/deepfunding-demo-v1.mp4`,
  ],
  { stdio: "inherit" },
);
const bytes = statSync(`${target}/deepfunding-demo-v1.mp4`).size;
if (bytes >= 25 * 1024 * 1024)
  throw new Error("Film exceeds Workers static-asset limit");
copyFileSync(
  `${root}/video/deepfunding-demo/output/shot-01.png`,
  `${target}/poster.png`,
);
const hash = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
writeFileSync(
  `${target}/manifest.json`,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      duration_seconds: 28,
      width: 1920,
      height: 1080,
      fps: 30,
      bytes,
      source_sha256: hash(source),
      web_sha256: hash(`${target}/deepfunding-demo-v1.mp4`),
      content:
        "Synthetic product concept, illustrative rankings, original procedural soundtrack.",
      encoding:
        "H.264 CRF 20 slow, source AAC, faststart; original master preserved locally.",
    },
    null,
    2,
  ) + "\n",
);
