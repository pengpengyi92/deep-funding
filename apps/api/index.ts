import { z } from "zod";
import {
  companySchema,
  funderSchema,
  noteSchema,
  type Profile,
  type Company,
  type Funder,
  type Match,
  type Run,
  type Handoff,
} from "../../packages/schemas";
import { demo } from "../../data/demo";
import { evaluate, compareMatches } from "../../packages/matching";
import { companyAgents, fundingAgents } from "../../packages/agents";
import { createRun, emit } from "../../packages/a2a";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
const hash = async (value: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
function checkOrigin(request: Request) {
  if (request.headers.get("Origin") !== new URL(request.url).origin)
    throw new HttpError(403, "Same-origin request required.");
}
async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (!request.headers.get("Content-Type")?.startsWith("application/json"))
    throw new HttpError(415, "JSON content type required.");
  if (Number(request.headers.get("Content-Length") || 0) > 32768)
    throw new HttpError(413, "Request exceeds 32 KiB.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 32768) {
      await reader.cancel();
      throw new HttpError(413, "Request exceeds 32 KiB.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
  const result = schema.safeParse(parsed);
  if (!result.success)
    throw new HttpError(
      400,
      result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  return result.data;
}
async function owner(request: Request, env: Env): Promise<string> {
  const token = request.headers
    .get("Cookie")
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith("df_session="))
    ?.slice(11);
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new HttpError(401, "Start a workspace first.");
  const id = await hash(token);
  const row = await env.DB.prepare(
    "SELECT id FROM workspaces WHERE id=? AND expires_at>?",
  )
    .bind(id, new Date().toISOString())
    .first();
  if (!row)
    throw new HttpError(401, "Workspace expired. Start a new workspace.");
  return id;
}
type Row = {
  id: string;
  kind: "company" | "funder";
  version: number;
  data: string;
  updated_at: string;
};
const toProfile = (r: Row): Profile<Company | Funder> => ({
  id: r.id,
  kind: r.kind,
  version: r.version,
  data: JSON.parse(r.data),
  updatedAt: r.updated_at,
});
async function profiles(env: Env, user: string, kind?: string) {
  const query = kind
    ? env.DB.prepare(
        "SELECT * FROM profiles WHERE owner=? AND kind=? ORDER BY updated_at DESC,id",
      ).bind(user, kind)
    : env.DB.prepare(
        "SELECT * FROM profiles WHERE owner=? ORDER BY updated_at DESC,id",
      ).bind(user);
  return (await query.all<Row>()).results.map(toProfile);
}
async function profile(env: Env, user: string, id: string, kind?: string) {
  const row = await env.DB.prepare(
    "SELECT * FROM profiles WHERE owner=? AND id=?",
  )
    .bind(user, id)
    .first<Row>();
  if (!row || (kind && row.kind !== kind))
    throw new HttpError(404, "Profile not found.");
  return toProfile(row);
}
async function stored<T>(
  env: Env,
  user: string,
  id: string,
  table: "matches" | "runs",
): Promise<T> {
  const row = await env.DB.prepare(
    `SELECT data FROM ${table} WHERE owner=? AND id=?`,
  )
    .bind(user, id)
    .first<{ data: string }>();
  if (!row) throw new HttpError(404, "Record not found.");
  return JSON.parse(row.data) as T;
}
const putRun = (env: Env, user: string, run: Run) =>
  env.DB.prepare(
    "INSERT INTO runs(id,owner,data,created_at) VALUES(?,?,?,?)",
  ).bind(run.id, user, JSON.stringify(run), run.createdAt);
async function capacity(
  env: Env,
  user: string,
  table: "runs" | "profiles",
  limit: number,
) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ${table} WHERE owner=?`,
  )
    .bind(user)
    .first<{ n: number }>();
  if ((row?.n ?? 0) >= limit)
    throw new HttpError(
      429,
      "Workspace demo limit reached. Export and delete the workspace before starting another.",
    );
}

async function api(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url),
    path = url.pathname,
    method = request.method;
  if (path === "/api/health" && method === "GET")
    return json({
      status: "ok",
      version: "0.1.0",
      engine: "deterministic",
      outboundIntroductions: false,
    });
  if (!["GET", "POST", "PUT", "DELETE"].includes(method))
    throw new HttpError(405, "Method not allowed.");
  if (method !== "GET") checkOrigin(request);
  if (path === "/api/workspace" && method === "POST") {
    try {
      await owner(request, env);
      return json({ ready: true });
    } catch (e) {
      if (!(e instanceof HttpError) || e.status !== 401) throw e;
    }
    if (
      !(
        await env.WORKSPACE_LIMITER.limit({
          key: await hash(request.headers.get("CF-Connecting-IP") || "local"),
        })
      ).success
    )
      throw new HttpError(
        429,
        "Workspace creation limit reached. Retry in a minute.",
      );
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const id = await hash(token),
      now = new Date();
    await env.DB.prepare(
      "INSERT INTO workspaces(id,created_at,expires_at) VALUES(?,?,?)",
    )
      .bind(
        id,
        now.toISOString(),
        new Date(now.getTime() + 7 * 86400000).toISOString(),
      )
      .run();
    const response = json({ ready: true, expiresInDays: 7 }, 201);
    response.headers.set(
      "Set-Cookie",
      `df_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800${url.protocol === "https:" ? "; Secure" : ""}`,
    );
    return response;
  }
  const user = await owner(request, env);
  if (path === "/api/workspace" && method === "DELETE") {
    await env.DB.prepare("DELETE FROM workspaces WHERE id=?").bind(user).run();
    const response = json({ deleted: true });
    response.headers.set(
      "Set-Cookie",
      "df_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0",
    );
    return response;
  }
  if (path === "/api/workspace" && method === "GET") {
    const all = await profiles(env, user);
    const matches = (
      await env.DB.prepare(
        "SELECT data FROM matches WHERE owner=? ORDER BY created_at DESC",
      )
        .bind(user)
        .all<{ data: string }>()
    ).results.map((x) => JSON.parse(x.data));
    const requests = (
      await env.DB.prepare(
        "SELECT data FROM requests WHERE owner=? ORDER BY created_at DESC",
      )
        .bind(user)
        .all<{ data: string }>()
    ).results.map((x) => JSON.parse(x.data));
    const workspace = await env.DB.prepare(
      "SELECT expires_at FROM workspaces WHERE id=?",
    )
      .bind(user)
      .first<{ expires_at: string }>();
    return json({
      companies: all.filter((p) => p.kind === "company"),
      funders: all.filter((p) => p.kind === "funder"),
      matches,
      requests,
      expiresAt: workspace?.expires_at,
    });
  }
  if (path === "/api/workspace/demo" && method === "POST") {
    if ((await profiles(env, user)).length)
      throw new HttpError(
        409,
        "Demo data already loaded or workspace contains profiles.",
      );
    const data = demo(new Date());
    await env.DB.batch(
      [...data.companies, ...data.funders].map((p) =>
        env.DB.prepare(
          "INSERT INTO profiles(id,owner,kind,version,data,updated_at) VALUES(?,?,?,?,?,?)",
        ).bind(
          p.id,
          user,
          p.kind,
          p.version,
          JSON.stringify(p.data),
          p.updatedAt,
        ),
      ),
    );
    return json({ seeded: true }, 201);
  }
  const route = path.match(
    /^\/api\/(companies|funders)(?:\/([a-zA-Z0-9-]+))?(?:\/(analyze|audit|matches))?$/,
  );
  if (route) {
    const [, collection, id, action] = route,
      kind = collection === "companies" ? "company" : "funder";
    if (!id && method === "GET") return json(await profiles(env, user, kind));
    if ((!id && method === "POST") || (id && !action && method === "PUT")) {
      const data =
        kind === "company"
          ? await body(request, companySchema)
          : await body(request, funderSchema);
      const now = new Date().toISOString();
      if (id) {
        const p = await profile(env, user, id, kind);
        const result = await env.DB.prepare(
          "UPDATE profiles SET data=?,version=version+1,updated_at=? WHERE owner=? AND id=? AND version=?",
        )
          .bind(JSON.stringify(data), now, user, id, p.version)
          .run();
        if (!result.meta.changes)
          throw new HttpError(
            409,
            "Profile changed concurrently. Reload and retry.",
          );
        return json(await profile(env, user, id, kind));
      }
      await capacity(env, user, "profiles", 20);
      const newId = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT INTO profiles(id,owner,kind,version,data,updated_at) VALUES(?,?,?,1,?,?)",
      )
        .bind(newId, user, kind, JSON.stringify(data), now)
        .run();
      return json(await profile(env, user, newId, kind), 201);
    }
    if (id && !action && method === "GET")
      return json(await profile(env, user, id, kind));
    if (id && action && method === "POST") {
      await capacity(env, user, "runs", 100);
      const p = await profile(env, user, id, kind),
        now = new Date();
      if (action === "matches") {
        if (!p.data.shareForMatching)
          throw new HttpError(409, "Enable profile sharing before matching.");
        const others = (
          await profiles(env, user, kind === "company" ? "funder" : "company")
        ).filter((o) => o.data.shareForMatching);
        if (!others.length)
          throw new HttpError(
            409,
            "No consenting counterparty profiles available.",
          );
        const results = others.map((o) =>
          evaluate(
            (kind === "company" ? p : o) as Profile<Company>,
            (kind === "funder" ? p : o) as Profile<Funder>,
            now,
          ),
        );
        await env.DB.batch(
          results.flatMap(({ match, run }) => [
            putRun(env, user, run),
            env.DB.prepare(
              "INSERT INTO matches(id,owner,company_id,funder_id,data,created_at) VALUES(?,?,?,?,?,?)",
            ).bind(
              match.id,
              user,
              match.companyId,
              match.funderId,
              JSON.stringify(match),
              match.createdAt,
            ),
          ]),
        );
        return json(results.map((r) => r.match).sort(compareMatches), 201);
      }
      const result =
        kind === "company"
          ? action === "audit"
            ? companyAgents.audit(p.data as Company, now)
            : companyAgents.analysis(p.data as Company)
          : action === "audit"
            ? fundingAgents.audit(p.data as Funder, now)
            : fundingAgents.analysis(p.data as Funder);
      const run = createRun(now);
      emit(
        run,
        action === "audit" ? "AUDIT_READY" : "ANALYSIS_READY",
        `${kind}.${action}`,
        "human",
        `${action} complete for profile v${p.version}.`,
        { profileId: id, profileVersion: p.version, result },
      );
      await putRun(env, user, run).run();
      return json({ result, runId: run.id });
    }
  }
  const mr = path.match(
    /^\/api\/matches\/([a-zA-Z0-9-]+)(?:\/(request-info|respond-info|request-introduction))?$/,
  );
  if (mr) {
    const [, id, action] = mr;
    const m = await stored<Match>(env, user, id, "matches");
    const c = await profile(env, user, m.companyId),
      f = await profile(env, user, m.funderId);
    const stale =
      c.version !== m.companyVersion ||
      f.version !== m.funderVersion ||
      new Date(m.createdAt).toISOString().slice(0, 10) !==
        new Date().toISOString().slice(0, 10);
    const existing = (
      await env.DB.prepare(
        "SELECT data FROM requests WHERE owner=? AND match_id=?",
      )
        .bind(user, id)
        .all<{ data: string }>()
    ).results.map((x) => JSON.parse(x.data));
    if (!action && method === "GET")
      return json({ match: m, stale, requests: existing });
    if (action && method === "POST") {
      const { note } = await body(request, noteSchema);
      if (stale)
        throw new HttpError(
          409,
          "Match is stale. Rerun against current profiles and evidence before a handoff.",
        );
      if (!c.data.shareForMatching || !f.data.shareForMatching)
        throw new HttpError(409, "Sharing consent has been withdrawn.");
      if (
        action === "request-introduction" &&
        evaluate(c as Profile<Company>, f as Profile<Funder>).match.decision !==
          "INTRODUCTION_READY"
      )
        throw new HttpError(
          409,
          "Current evidence and hard constraints do not permit an introduction request.",
        );
      if (
        action === "respond-info" &&
        !existing.some((r) => r.kind === "information")
      )
        throw new HttpError(
          409,
          "Record an information request before its response.",
        );
      const kind =
        action === "request-info"
          ? "information"
          : action === "respond-info"
            ? "response"
            : "introduction";
      if (existing.some((r) => r.kind === kind))
        return json(existing.find((r) => r.kind === kind));
      const createdAt = new Date().toISOString();
      const handoff: Handoff = {
        id: crypto.randomUUID(),
        kind,
        matchId: id,
        createdAt,
        status: "RECORDED_NOT_SENT",
        note,
      };
      const run = await stored<Run>(env, user, m.runId, "runs");
      const event = emit(
        run,
        kind === "information"
          ? "GAP_REQUEST"
          : kind === "response"
            ? "GAP_RESPONSE"
            : "HUMAN_HANDOFF",
        "human",
        kind === "introduction" ? "human.introduction-queue" : "human.review",
        kind === "response"
          ? "Response recorded. Update source profile and rerun; this text cannot override a gate."
          : "Human action recorded; no message sent.",
        { requestId: handoff.id, status: handoff.status },
      );
      event.timestamp = createdAt;
      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO requests(id,owner,match_id,kind,data,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM profiles WHERE owner=? AND id=? AND version=?) AND EXISTS(SELECT 1 FROM profiles WHERE owner=? AND id=? AND version=?) ON CONFLICT(owner,match_id,kind) DO NOTHING",
        ).bind(
          handoff.id,
          user,
          id,
          kind,
          JSON.stringify(handoff),
          createdAt,
          user,
          c.id,
          c.version,
          user,
          f.id,
          f.version,
        ),
        env.DB.prepare(
          "UPDATE runs SET data=json_insert(data,'$.events[#]',json_set(json(?),'$.sequence',json_array_length(data,'$.events')+1)) WHERE owner=? AND id=? AND changes()>0",
        ).bind(JSON.stringify(event), user, run.id),
      ]);
      const saved = await env.DB.prepare(
        "SELECT data FROM requests WHERE owner=? AND match_id=? AND kind=?",
      )
        .bind(user, id, kind)
        .first<{ data: string }>();
      if (!saved)
        throw new HttpError(
          409,
          "Profile changed during handoff. Rerun the match.",
        );
      return json(JSON.parse(saved.data), 201);
    }
  }
  const rr = path.match(/^\/api\/agent-runs\/([a-zA-Z0-9-]+)$/);
  if (rr && method === "GET")
    return json(await stored<Run>(env, user, rr[1], "runs"));
  throw new HttpError(404, "API route not found.");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith("/api/"))
      return env.ASSETS.fetch(request);
    try {
      if (
        !(
          await env.API_LIMITER.limit({
            key: await hash(request.headers.get("CF-Connecting-IP") || "local"),
          })
        ).success
      )
        throw new HttpError(
          429,
          "API request limit reached. Retry in a minute.",
        );
      return await api(request, env);
    } catch (error) {
      if (error instanceof HttpError)
        return json({ error: error.message }, error.status);
      console.error(
        JSON.stringify({
          event: "api_error",
          path: new URL(request.url).pathname,
          errorType: error instanceof Error ? error.name : "unknown",
        }),
      );
      return json(
        { error: "The request could not be completed. Please retry." },
        500,
      );
    }
  },
  async scheduled(_event: ScheduledController, env: Env) {
    await env.DB.prepare("DELETE FROM workspaces WHERE expires_at<?")
      .bind(new Date().toISOString())
      .run();
  },
} satisfies ExportedHandler<Env>;
