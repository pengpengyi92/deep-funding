import fs from "node:fs/promises";

// Original deterministic synth score. No sampled or third-party audio assets.
export async function writeScore(file, duration = 28) {
  const rate = 48000,
    n = Math.round(rate * duration),
    channels = 2,
    data = Buffer.alloc(44 + n * 4);
  data.write("RIFF");
  data.writeUInt32LE(36 + n * 4, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(channels, 22);
  data.writeUInt32LE(rate, 24);
  data.writeUInt32LE(rate * 4, 28);
  data.writeUInt16LE(4, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(n * 4, 40);
  const chords = [
    [55, 59, 62, 66],
    [52, 55, 59, 62],
    [48, 52, 55, 59],
    [50, 57, 60, 64],
  ];
  const hz = (m) => 440 * 2 ** ((m - 69) / 12),
    sine = (f, t) => Math.sin(2 * Math.PI * f * t);
  const envelope = (t, len) =>
    Math.min(1, t / 0.45) * Math.min(1, Math.max(0, (len - t) / 0.7));
  for (let i = 0; i < n; i++) {
    const t = i / rate,
      block = Math.floor(t / 7),
      local = t % 7;
    let l = 0,
      r = 0;
    for (let k = Math.max(0, block - 1); k <= block; k++) {
      const age = t - k * 7;
      if (age < 0 || age > 8) continue;
      const env = envelope(age, 8);
      chords[k % 4].forEach((m, j) => {
        const f = hz(m);
        const voice =
          (sine(f, age) + 0.26 * sine(f * 2, age) + 0.08 * sine(f * 3, age)) *
          0.016 *
          env;
        l += voice * (0.75 + j * 0.07);
        r += voice * (1 - j * 0.065);
      });
    }
    const beat = t % 0.5,
      note = chords[block % 4][Math.floor(local / 0.5) % 4] + 12;
    const pluck =
      (sine(hz(note), beat) + 0.3 * sine(hz(note) * 2, beat)) *
      0.032 *
      Math.exp(-beat * 12) *
      Math.min(1, beat / 0.01);
    l += pluck * 0.8;
    r += pluck;
    const kickAge = t % 1;
    const kick =
      0.035 *
      sine(52 + 50 * Math.exp(-kickAge * 35), kickAge) *
      Math.exp(-kickAge * 15);
    l += kick;
    r += kick;
    for (const event of [17.8, 20.2, 21, 22.3, 25.1]) {
      const a = t - event;
      if (a >= 0 && a < 1.4) {
        const ping =
          (sine(1046.5, a) + 0.35 * sine(1569.75, a)) *
          0.033 *
          Math.exp(-a * 4) *
          Math.min(1, a / 0.008);
        l += ping;
        r += ping;
      }
    }
    const fade = Math.min(1, t / 1.1) * Math.min(1, (duration - t) / 1.4);
    data.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, l * fade)) * 32767),
      44 + i * 4,
    );
    data.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, r * fade)) * 32767),
      46 + i * 4,
    );
  }
  await fs.writeFile(file, data);
}
