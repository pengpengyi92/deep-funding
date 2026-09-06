import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Markdown from "react-markdown";
import {
  Search,
  ArrowUpRight,
  BookOpen,
  Network,
  RotateCcw,
} from "lucide-react";
import type { KnowledgeRecord } from "../../../packages/knowledge/public-graph";
import "./knowledge-workspace.css";

const label = (value: string) => value.replaceAll("_", " ");
const fields = {
  funding: ["category", "stage", "industry", "location"] as const,
  compliance: [
    "category",
    "company",
    "jurisdiction",
    "status",
    "evidence_level",
    "risk_tags",
  ] as const,
};

export function KnowledgeWorkspace({
  kind,
}: {
  kind: "funding" | "compliance";
}) {
  const [records, setRecords] = useState<KnowledgeRecord[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const controller = new AbortController();
    setLoaded(false);
    setError("");
    fetch(`/api/knowledge/${kind}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("Knowledge service unavailable");
        return r.json();
      })
      .then((v) => {
        if (
          !v ||
          typeof v !== "object" ||
          !("records" in v) ||
          !Array.isArray(v.records)
        )
          throw new Error("Invalid knowledge response");
        setRecords(v.records as KnowledgeRecord[]);
        setLoaded(true);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(String(e.message));
      });
    return () => controller.abort();
  }, [kind]);
  const filtered = records.filter((row) => {
    const q = params.get("q")?.toLowerCase();
    if (q && !JSON.stringify(row).toLowerCase().includes(q)) return false;
    return fields[kind].every((key) => {
      const value = params.get(key),
        field = row[key];
      return (
        !value ||
        (Array.isArray(field)
          ? field.some((v) => v === value)
          : field === value)
      );
    });
  });
  const selected = records.find((r) => r.id === params.get("id"));
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "id") next.delete("id");
    setParams(next, { replace: key !== "id" });
  }
  return (
    <main className="knowledge-page">
      <div className="knowledge-heading">
        <div>
          <p className="eyebrow">DEEP FUNDING / KNOWLEDGE</p>
          <h1>
            {kind === "funding" ? "Capital & resources" : "Compliance evidence"}
          </h1>
        </div>
        <nav className="knowledge-tabs" aria-label="Knowledge navigation">
          <Link
            className={kind === "funding" ? "active" : ""}
            to="/knowledge/funding"
          >
            Funding
          </Link>
          <Link
            className={kind === "compliance" ? "active" : ""}
            to="/knowledge/compliance"
          >
            Compliance
          </Link>
          <Link to="/data-explorer">Private database</Link>
        </nav>
      </div>
      <div className="knowledge-summary">
        <BookOpen size={20} />
        <strong>
          {
            records.filter((r) => ["entity", "case"].includes(r.record_type))
              .length
          }{" "}
          sourced records
        </strong>
        <span>
          {records.filter((r) => r.record_type === "template").length} templates
        </span>
        <span>Source inspection: 2026-09-06</span>
        <span>
          {kind === "funding"
            ? "Availability and mandates require verification"
            : "Research context, not a blacklist or legal opinion"}
        </span>
      </div>
      <section className="knowledge-filters" aria-label="Knowledge filters">
        <label className="search-field">
          <span>
            <Search size={16} /> Search
          </span>
          <input
            aria-label="Search knowledge"
            value={params.get("q") || ""}
            onChange={(e) => change("q", e.target.value)}
          />
        </label>
        {fields[kind].map((key) => {
          const options = [
            ...new Set(
              records.flatMap((r) => {
                const field = r[key];
                return Array.isArray(field) ? field : field ? [field] : [];
              }),
            ),
          ].sort();
          return (
            <label key={key}>
              {label(key)}
              <select
                aria-label={label(key)}
                value={params.get(key) || ""}
                onChange={(e) => change(key, e.target.value)}
              >
                <option value="">All</option>
                {options.map((v) => (
                  <option key={v} value={v}>
                    {label(v)}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
        <button
          className="icon-button"
          title="Reset filters"
          aria-label="Reset filters"
          onClick={() => setParams({})}
        >
          <RotateCcw size={17} />
        </button>
      </section>
      {error && <p role="alert">{error}</p>}
      {!loaded && !error && <p role="status">Loading knowledge...</p>}
      {loaded && (
        <div className={selected ? "knowledge-columns" : ""}>
          <section aria-label="Knowledge records">
            <p className="muted">{filtered.length} results</p>
            {!filtered.length && <p>No records match these filters.</p>}
            <div className="knowledge-list">
              {filtered.map((row) => (
                <button
                  key={row.id}
                  aria-pressed={selected?.id === row.id}
                  className="knowledge-row"
                  onClick={() => change("id", row.id)}
                >
                  <span className="knowledge-kind">{row.record_type}</span>
                  <strong>{row.name}</strong>
                  <span>
                    {row.category.map(label).join(", ") || "taxonomy"}
                  </span>
                  <span
                    className={
                      row.status === "disputed" ? "disputed-label" : "muted"
                    }
                  >
                    {label(row.status)}
                  </span>
                </button>
              ))}
            </div>
          </section>
          {selected && (
            <article className="knowledge-detail" aria-label="Knowledge detail">
              <div className="knowledge-detail-top">
                <span
                  className={
                    selected.status === "disputed" ? "disputed-label" : ""
                  }
                >
                  {label(selected.status)} / {label(selected.evidence_level)}
                </span>
                <button
                  className="text-button"
                  onClick={() => change("id", "")}
                >
                  Close
                </button>
              </div>
              <h2>{selected.name}</h2>
              <dl>
                <dt>Verified scope</dt>
                <dd>
                  {selected.verified_scope.join(", ") ||
                    "Template / internal framework"}
                </dd>
                <dt>Source inspection</dt>
                <dd>{selected.last_verified}</dd>
              </dl>
              {selected.claims.length > 0 && (
                <section className="claim-list" aria-label="Evidence claims">
                  <h3>Claims & responses</h3>
                  {selected.claims.map((claim, i) => (
                    <div key={i}>
                      <strong>{label(claim.type)}</strong>
                      <p>{claim.text}</p>
                      {claim.source_url && (
                        <a
                          href={claim.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Source <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>
                  ))}
                </section>
              )}
              <div className="knowledge-markdown">
                <Markdown
                  components={{
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {selected.markdown}
                </Markdown>
              </div>
              {selected.related_ids.length > 0 && (
                <section>
                  <h3>
                    <Network size={17} /> Related nodes
                  </h3>
                  {selected.related_ids.map((id) => (
                    <button
                      key={id}
                      className="text-button"
                      onClick={() => setParams({ id })}
                    >
                      {records.find((r) => r.id === id)?.name || id}
                    </button>
                  ))}
                </section>
              )}
              <details>
                <summary>Record provenance</summary>
                <pre>
                  {JSON.stringify(
                    {
                      path: selected.path,
                      hash: selected.content_hash,
                      sources: selected.source_urls,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </article>
          )}
        </div>
      )}
    </main>
  );
}
