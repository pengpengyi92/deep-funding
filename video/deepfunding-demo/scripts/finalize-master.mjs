import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "output",
);
const file = path.join(root, "deepfunding-demo.mp4"),
  archive = path.join(root, "deepfunding-demo-before-mastering.mp4");
const probe = JSON.parse(
  execFileSync(
    process.env.FFPROBE_PATH || "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=pix_fmt",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8", windowsHide: true },
  ),
);
if (probe.streams[0].pix_fmt !== "yuvj420p")
  throw new Error(
    "Mastering is only for the original full-range export, not an already mastered video.",
  );
await fs.copyFile(file, archive);
execFileSync(
  process.env.FFMPEG_PATH || "ffmpeg",
  [
    "-hide_banner",
    "-y",
    "-v",
    "error",
    "-i",
    archive,
    "-i",
    path.join(root, "original-score.wav"),
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-vf",
    "scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p",
    "-c:v",
    "libx264",
    "-crf",
    "17",
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    "-color_range",
    "tv",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-af",
    "loudnorm=I=-20:LRA=9:TP=-2",
    "-ar",
    "48000",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-t",
    "28",
    file,
  ],
  { windowsHide: true, stdio: "inherit" },
);
const manifestFile = path.join(root, "render-manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
const bytes = await fs.readFile(file);
manifest.pre_master_sha256 = manifest.sha256;
manifest.pre_master_bytes = manifest.bytes;
manifest.mastered_at = new Date().toISOString();
manifest.sha256 = createHash("sha256").update(bytes).digest("hex");
manifest.bytes = bytes.length;
manifest.mastering =
  "BT.601 full range -> BT.709 limited range H.264 CRF17; original PCM -> loudnorm I-20 LRA9 TP-2 -> AAC192 / 48kHz";
await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
