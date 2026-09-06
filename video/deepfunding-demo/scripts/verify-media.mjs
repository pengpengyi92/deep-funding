import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "output"),
  file = path.join(output, "deepfunding-demo.mp4");
const probe = JSON.parse(
  execFileSync(
    process.env.FFPROBE_PATH || "ffprobe",
    [
      "-v",
      "error",
      "-count_frames",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8", windowsHide: true },
  ),
);
const video = probe.streams.find((s) => s.codec_type === "video"),
  audio = probe.streams.find((s) => s.codec_type === "audio");
assert.equal(video.codec_name, "h264");
assert.equal(video.width, 1920);
assert.equal(video.height, 1080);
assert.equal(video.pix_fmt, "yuv420p");
assert.equal(video.r_frame_rate, "30/1");
assert.equal(Number(video.nb_read_frames), 840);
assert.equal(Number(video.duration), 28);
assert.equal(audio.codec_name, "aac");
assert.equal(audio.channels, 2);
assert.ok(Math.abs(Number(audio.duration) - 28) < 0.1);
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
execFileSync(
  ffmpeg,
  ["-hide_banner", "-v", "error", "-i", file, "-f", "null", "-"],
  { windowsHide: true },
);
const select =
  "select=" +
  [54, 165, 285, 435, 564, 633, 690, 798].map((n) => `eq(n\\,${n})`).join("+");
execFileSync(
  ffmpeg,
  [
    "-hide_banner",
    "-v",
    "error",
    "-y",
    "-i",
    file,
    "-vf",
    select,
    "-fps_mode",
    "vfr",
    path.join(output, "encoded-shot-%02d.png"),
  ],
  { windowsHide: true },
);
const bytes = await fs.readFile(file);
const result = {
  checked_at: new Date().toISOString(),
  video: {
    codec: video.codec_name,
    width: video.width,
    height: video.height,
    fps: video.r_frame_rate,
    frames: Number(video.nb_read_frames),
    duration_seconds: Number(video.duration),
    pixel_format: video.pix_fmt,
  },
  audio: {
    codec: audio.codec_name,
    channels: audio.channels,
    sample_rate: audio.sample_rate,
    duration_seconds: Number(audio.duration),
  },
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  full_decode: "PASS",
  encoded_storyboard_frames: 8,
};
await fs.writeFile(
  path.join(output, "media-verification.json"),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
