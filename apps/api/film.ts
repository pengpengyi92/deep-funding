// Static Assets can ignore Range. Adapt the single published film with bounded streaming.
export async function serveFilm(
  request: Request,
  assets: { fetch(request: Request): Promise<Response> },
  knownSize?: number,
): Promise<Response> {
  if (!["GET", "HEAD"].includes(request.method))
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("range");
  upstreamHeaders.delete("if-range");
  const source = await assets.fetch(
    new Request(request.url, {
      method: request.method,
      headers: upstreamHeaders,
    }),
  );
  if (source.status !== 200) return source;
  const headers = new Headers(source.headers);
  headers.set("Accept-Ranges", "bytes");
  const size = Number(headers.get("Content-Length") || knownSize);
  const range = request.headers.get("Range");
  const ifRange = request.headers.get("If-Range");
  if (
    request.method === "HEAD" ||
    !range ||
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    (ifRange && (ifRange.startsWith("W/") || ifRange !== headers.get("ETag")))
  )
    return new Response(source.body, { status: 200, headers });
  // Multiple or unsupported ranges fall back to a full representation.
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2]))
    return new Response(source.body, { status: 200, headers });
  const start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  const end = match[1]
    ? match[2]
      ? Math.min(size - 1, Number(match[2]))
      : size - 1
    : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start >= size ||
    end < start
  ) {
    await source.body?.cancel();
    headers.set("Content-Range", `bytes */${size}`);
    headers.set("Content-Length", "0");
    return new Response(null, { status: 416, headers });
  }
  const reader = source.body!.getReader();
  let offset = 0;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const from = Math.max(0, start - offset);
        const to = Math.min(value.byteLength, end + 1 - offset);
        offset += value.byteLength;
        if (to > from) controller.enqueue(value.subarray(from, to));
        if (offset > end) {
          await reader.cancel();
          controller.close();
          return;
        }
        if (to > from) return;
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(body, { status: 206, headers });
}
