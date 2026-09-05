import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Download,
  Search,
  Play,
  Plus,
  LoaderCircle,
} from "lucide-react";
import type { Company, Profile, Match, Run } from "../../../packages/schemas";
import type { FundingProfile } from "../../../packages/knowledge/profile-schema";
import { categoryGroups } from "../../../packages/knowledge/taxonomy";
import {
  fundingReadiness,
  type Readiness,
} from "../../../packages/knowledge/readiness";

type Catalogue = {
  version: string;
  profiles: FundingProfile[];
  examples: Profile<Company>[];
};
type Preview = { match: Match; run: Run; preview: true };
const words = (s: string) => s.replaceAll("_", " ");
async function request<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: data ? "POST" : "GET",
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result && typeof result === "object" && "error" in result
        ? String(result.error)
        : "Request failed",
    );
  return result as T;
}
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function ReadinessPanel({ value }: { value: Readiness }) {
  return (
    <section className="readiness-panel">
      <div className="explorer-heading">
        <h2>Funding readiness</h2>
        <strong>
          {value.funding_readiness_score}
          <small> / 100</small>
        </strong>
      </div>
      <p>
        {words(value.company_stage || "unknown stage")} · Financing round:{" "}
        {words(value.financing_round || "unknown")}
      </p>
      <small>{value.interpretation}</small>
      <div className="readiness-bars">
        {value.components.map((c) => (
          <div key={c.name}>
            <span>{c.name}</span>
            <meter
              min={0}
              max={c.weight}
              value={c.points}
              aria-label={c.name}
            />
            <small>
              {c.points}/{c.weight}
            </small>
          </div>
        ))}
      </div>
      <h3>Discovery shortlist</h3>
      <div className="catalogue-badges">
        {value.recommended_categories.map((c) => (
          <span key={c.category} title={c.reason}>
            {words(c.category)}
          </span>
        ))}
      </div>
      {value.not_recommended_now.map((s) => (
        <p className="muted" key={s}>
          {s}
        </p>
      ))}
      <h3>Next milestones</h3>
      <ul>
        {value.next_milestones.length ? (
          value.next_milestones.map((x) => <li key={x}>{x}</li>)
        ) : (
          <li>
            Validate claims with people and test the specific provider mandate.
          </li>
        )}
      </ul>
    </section>
  );
}
export function FundingExplorer({
  companies,
  onImport,
}: {
  companies: Profile<Company>[];
  onImport: (slug: string) => Promise<void>;
}) {
  const [data, setData] = useState<Catalogue | null>(null),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [example, setExample] = useState("example:preseed-ai"),
    [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const group = params.get("category") || "all",
    slug = params.get("entity") || "y-combinator";
  const revision = useRef(0);
  useEffect(() => {
    let active = true;
    request<Catalogue>("/funding-catalogue")
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    revision.current++;
    setPreview(null);
    setBusy(false);
    setError("");
  }, [slug, example]);
  const entry = data?.profiles.find((p) => p.slug === slug);
  const selectedCompany = example.startsWith("example:")
    ? data?.examples.find((c) => `example:${c.id}` === example)
    : companies.find((c) => `company:${c.id}` === example);
  const visible =
    data?.profiles.filter(
      (p) =>
        (group === "all" ||
          categoryGroups
            .find((g) => g.id === group)
            ?.categories.some((c) => p.categories.includes(c))) &&
        `${p.name} ${p.categories.join(" ")} ${p.provides.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ) || [];
  const navigate = (next: Record<string, string>) => setParams(next);
  async function run() {
    if (!entry) return;
    const current = ++revision.current;
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const result = await request<Preview>(
        `/funding-catalogue/${entry.slug}/preview`,
        example.startsWith("example:")
          ? { exampleId: example.slice(8) }
          : { companyId: example.slice(8) },
      );
      if (current === revision.current) setPreview(result);
    } catch (e) {
      if (current === revision.current)
        setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      if (current === revision.current) setBusy(false);
    }
  }
  return (
    <main className="workspace explorer">
      <div className="explorer-heading">
        <div>
          <small>DEEP FUNDING / KNOWLEDGE BASE</small>
          <h1>Funding Explorer</h1>
          <p>Capital, resources and the next company milestone.</p>
        </div>
        <a
          href="/api/funding-schema"
          className="text-button"
          target="_blank"
          rel="noreferrer"
        >
          <Download size={17} /> Profile schema
        </a>
      </div>
      <nav className="catalogue-tabs" aria-label="Funding categories">
        <button
          aria-pressed={group === "all"}
          onClick={() => navigate({ entity: slug })}
        >
          All
        </button>
        {categoryGroups.map((g) => (
          <button
            key={g.id}
            aria-pressed={group === g.id}
            onClick={() => navigate({ category: g.id, entity: slug })}
          >
            {g.name}
          </button>
        ))}
      </nav>
      {group !== "all" && (
        <p className="muted">
          {categoryGroups.find((g) => g.id === group)?.description}
        </p>
      )}
      {error && (
        <p role="alert" className="catalogue-error">
          {error}
        </p>
      )}
      {!data ? (
        <p role="status">
          <LoaderCircle size={18} className="spin" /> Loading funding profiles
        </p>
      ) : (
        <div className="catalogue-layout">
          <aside className="catalogue-list">
            <label className="catalogue-search">
              <Search size={17} />
              <input
                aria-label="Search funding profiles"
                placeholder="Name or resource"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <small>
              {visible.length} entities · {data.version}
            </small>
            {visible.length ? (
              visible.map((p) => (
                <button
                  className="catalogue-row"
                  key={p.slug}
                  aria-pressed={p.slug === slug}
                  onClick={() => navigate({ category: group, entity: p.slug })}
                >
                  <strong>{p.name}</strong>
                  <span>{p.categories.map(words).join(" / ")}</span>
                  <small>
                    {p.source_metadata.status} ·{" "}
                    {p.provides_capital === false
                      ? "Resources only"
                      : p.provides_capital === null
                        ? "Capital unknown"
                        : "Capital + resources"}
                  </small>
                </button>
              ))
            ) : (
              <p>No matching profiles.</p>
            )}
          </aside>
          <div className="catalogue-detail">
            {entry ? (
              <>
                <div className="explorer-heading">
                  <h2>{entry.name}</h2>
                  <button
                    className="icon-button"
                    title="Download funding profile"
                    aria-label="Download funding profile"
                    onClick={() => download(entry, `${entry.slug}.json`)}
                  >
                    <Download size={18} />
                  </button>
                </div>
                <div className="catalogue-badges">
                  <span>{entry.source_metadata.status}</span>
                  {entry.categories.map((c) => (
                    <span key={c}>{words(c)}</span>
                  ))}
                </div>
                <p>{entry.description}</p>
                <dl className="catalogue-facts">
                  <div>
                    <dt>Policy</dt>
                    <dd>{words(entry.policy_id)} · internal heuristic</dd>
                  </div>
                  <div>
                    <dt>Target stages</dt>
                    <dd>
                      {entry.target_stages?.map(words).join(", ") || "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt>Geography</dt>
                    <dd>{entry.geographies?.join(", ") || "Unknown"}</dd>
                  </div>
                  <div>
                    <dt>Industries</dt>
                    <dd>{entry.industries?.join(", ") || "Unknown"}</dd>
                  </div>
                  <div>
                    <dt>Capital forms</dt>
                    <dd>
                      {entry.provides_capital === false
                        ? "None; resources only"
                        : entry.capital_forms?.map(words).join(", ") ||
                          "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt>Single-provider ticket</dt>
                    <dd>
                      {entry.ticket_usd
                        ? `$${entry.ticket_usd.min.toLocaleString()} - $${entry.ticket_usd.max.toLocaleString()}`
                        : entry.provides_capital === false
                          ? "Not applicable"
                          : "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt>Terms / deadline</dt>
                    <dd>
                      {entry.terms || "Unknown"} /{" "}
                      {entry.application.deadline || "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt>Exclusions</dt>
                    <dd>
                      {entry.exclusions === null
                        ? "Unknown"
                        : entry.exclusions.join(", ") ||
                          "None declared; human review still required"}
                    </dd>
                  </div>
                </dl>
                <h3>Resources</h3>
                <div className="catalogue-badges">
                  {entry.provides.map((r) => (
                    <span key={r}>{r}</span>
                  ))}
                </div>
                <h3>Company requirements</h3>
                <dl className="catalogue-requirements">
                  {Object.entries(entry.company_requirements).map(([k, v]) => (
                    <div key={k}>
                      <dt>{words(k)}</dt>
                      <dd>{v === null ? "Unknown" : words(String(v))}</dd>
                    </div>
                  ))}
                </dl>
                <section className="catalogue-sources">
                  <h3>Source & review</h3>
                  <p>{entry.source_metadata.notes}</p>
                  <small>
                    Full profile verified:{" "}
                    {entry.source_metadata.verified_at || "Not verified"}
                  </small>
                  {entry.source_metadata.sources.map((s) => (
                    <p key={s.url}>
                      {entry.source_metadata.status === "synthetic" ? (
                        <span>Fictional fixture reference</span>
                      ) : (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {new URL(s.url).hostname}
                          {new URL(s.url).pathname} <ArrowUpRight size={14} />
                        </a>
                      )}
                      <small> · observed {s.accessed_at}</small>
                    </p>
                  ))}
                  {entry.application.url && (
                    <a
                      className="text-button"
                      href={entry.application.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Official application page <ArrowUpRight size={16} />
                    </a>
                  )}
                </section>
                <section className="catalogue-preview">
                  <h3>Company match preview</h3>
                  <div className="catalogue-controls">
                    <label>
                      Company
                      <select
                        aria-label="Company"
                        value={example}
                        onChange={(e) => setExample(e.target.value)}
                      >
                        <optgroup label="Fictional examples">
                          {data.examples.map((c) => (
                            <option key={c.id} value={`example:${c.id}`}>
                              {c.data.name}
                            </option>
                          ))}
                        </optgroup>
                        {companies.length > 0 && (
                          <optgroup label="Your workspace">
                            {companies.map((c) => (
                              <option key={c.id} value={`company:${c.id}`}>
                                {c.data.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </label>
                    <button
                      className="button"
                      disabled={busy || !selectedCompany}
                      onClick={() => void run()}
                    >
                      {busy ? (
                        <LoaderCircle size={16} className="spin" />
                      ) : (
                        <Play size={16} />
                      )}{" "}
                      Run preview
                    </button>
                  </div>
                  {preview && (
                    <div className="preview-result">
                      <div className="explorer-heading">
                        <strong>{preview.match.score} / 100</strong>
                        <span className="badge neutral">
                          {words(preview.match.decision.toLowerCase())}
                        </span>
                      </div>
                      <p>
                        Policy: {preview.match.policyId}. Preview only; no
                        introduction or application is sent.
                      </p>
                      <ul>
                        {[
                          ...preview.match.hardFailures,
                          ...preview.match.gaps,
                        ].map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                      <details>
                        <summary>Score dimensions and reasons</summary>
                        <dl>
                          {preview.match.dimensions.map((d) => (
                            <div key={d.name}>
                              <dt>
                                {d.name}: {d.points}/{d.weight}
                              </dt>
                              <dd>{d.reason}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                      <details>
                        <summary>
                          A2A trace · {preview.run.events.length} events
                        </summary>
                        <ol>
                          {preview.run.events.map((e) => (
                            <li key={e.id}>
                              <strong>{words(e.type)}</strong> · {e.from} →{" "}
                              {e.to}
                              <p>{e.summary}</p>
                            </li>
                          ))}
                        </ol>
                      </details>
                      <button
                        className="text-button"
                        onClick={() =>
                          download(preview, `${entry.slug}-preview.json`)
                        }
                      >
                        <Download size={16} /> Download match & trace
                      </button>
                    </div>
                  )}
                </section>
                {selectedCompany && (
                  <ReadinessPanel
                    value={
                      preview?.match.companyAnalysis.readiness ||
                      fundingReadiness(selectedCompany.data)
                    }
                  />
                )}
                <button
                  className="button white"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onImport(entry.slug);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Import failed",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Plus size={17} /> Add to private workspace
                </button>
                <Link className="text-button" to="/founder/profile">
                  Company profile <ArrowUpRight size={16} />
                </Link>
              </>
            ) : (
              <p>Choose a funding entity.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
