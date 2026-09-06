import { cp, mkdir, readdir, readFile, writeFile, lstat } from "node:fs/promises";
import { resolve, join, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = join(root, ".local/modelscope-studio-package");
const publicRoot = join(root, "dist");
const extensions = new Set([".html", ".js", ".css", ".json", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".mp4", ".txt"]);
const list = [];
async function scan(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (folder === publicRoot && ["_headers", "_redirects"].includes(entry.name)) continue;
    if (entry.name.startsWith(".") || (await lstat(file)).isSymbolicLink())
      throw new Error("Hidden files and symlinks cannot enter a public bundle");
    if (entry.isDirectory()) await scan(file);
    else {
      if (!extensions.has(extname(file))) throw new Error("Unapproved public file type: " + entry.name);
      list.push(file);
    }
  }
}
await readFile(join(publicRoot, "index.html"));
await scan(publicRoot);
// A fresh destination prevents stale files or private additions surviving a rebuild.
await mkdir(dirname(destination), { recursive: true });
await mkdir(destination);
for (const file of list) {
  const target = join(destination, "site", relative(publicRoot, file));
  await mkdir(dirname(target), { recursive: true });
  await cp(file, target, { errorOnExist: true, force: false });
}
for (const name of ["Dockerfile", "default.conf.template", "15-validate-origin.sh", ".dockerignore", "README.md"]) {
  await cp(join(root, "mota/studio", name), join(destination, name));
}
await cp(join(root, "LICENSE"), join(destination, "LICENSE"));
const manifest = [];
for (const file of list) {
  const bytes = await readFile(file);
  manifest.push({
    path: "site/" + relative(publicRoot, file).replaceAll("\\", "/"),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
await writeFile(join(destination, "public-assets-manifest.json"), JSON.stringify({
  created_at: new Date().toISOString(),
  mode: "public-static-and-cloudflare-api-gateway",
  private_database_included: false,
  assets: manifest,
}, null, 2) + "\n");
console.log(JSON.stringify({ destination, assets: manifest.length, bytes: manifest.reduce((n, f) => n + f.bytes, 0) }));
