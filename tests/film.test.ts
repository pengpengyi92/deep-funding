import { describe, expect, it } from "vitest";
import { serveFilm } from "../apps/api/film";

const assets = {
  fetch: async (request: Request) =>
    new Response(request.method === "HEAD" ? null : "0123456789", {
      headers: {
        "Content-Length": "10",
        "Content-Type": "video/mp4",
        ETag: '"v1"',
      },
    }),
};
const get = (range?: string, method = "GET", ifRange?: string) =>
  serveFilm(
    new Request("https://example.test/film/deepfunding-demo-v1.mp4", {
      method,
      headers: {
        ...(range ? { Range: range } : {}),
        ...(ifRange ? { "If-Range": ifRange } : {}),
      },
    }),
    assets,
  );

describe("published film byte ranges", () => {
  it.each([
    ["bytes=0-3", "0123", "bytes 0-3/10"],
    ["bytes=5-", "56789", "bytes 5-9/10"],
    ["bytes=-3", "789", "bytes 7-9/10"],
    ["bytes=8-999", "89", "bytes 8-9/10"],
    ["bytes=-999", "0123456789", "bytes 0-9/10"],
  ])("%s returns exact bytes", async (range, body, contentRange) => {
    const response = await get(range);
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe(contentRange);
    expect(response.headers.get("Content-Length")).toBe(String(body.length));
    expect(await response.text()).toBe(body);
  });
  it.each(["bytes=10-", "bytes=7-3", "bytes=-0"])(
    "%s is unsatisfiable",
    async (range) => {
      const response = await get(range);
      expect(response.status).toBe(416);
      expect(response.headers.get("Content-Range")).toBe("bytes */10");
    },
  );
  it.each([undefined, "bytes=0-1,5-6", "items=1-4", "bytes=-"])(
    "%s falls back to full",
    async (range) => {
      const response = await get(range);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("0123456789");
    },
  );
  it("handles HEAD without partial content", async () => {
    const response = await get("bytes=0-3", "HEAD");
    expect(response.status).toBe(200);
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(await response.text()).toBe("");
  });
  it("ignores stale If-Range and applies a matching entity tag", async () => {
    expect((await get("bytes=0-3", "GET", '"old"')).status).toBe(200);
    expect((await get("bytes=0-3", "GET", '"v1"')).status).toBe(206);
  });
  it("rejects writes", async () => {
    expect((await get(undefined, "POST")).status).toBe(405);
  });
  it("uses the asset manifest when the binding omits Content-Length", async () => {
    const withoutSize = {
      fetch: async () => new Response("0123456789"),
    };
    const response = await serveFilm(
      new Request("https://example.test/film", {
        headers: { Range: "bytes=7-9" },
      }),
      withoutSize,
      10,
    );
    expect(response.status).toBe(206);
    expect(await response.text()).toBe("789");
  });
});
