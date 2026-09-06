import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  Plus,
  Save,
  RefreshCw,
  Play,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  X,
} from "lucide-react";
import "./knowledge-workspace.css";

type Row = Record<string, unknown>;
type Table = { name: string; count: number; columns: string[] };
type SchemaField = {
  type?: string;
  title?: string;
  enum?: string[];
  anyOf?: SchemaField[];
  $ref?: string;
  default?: unknown;
  minimum?: number;
  minLength?: number;
};
type FormSchema = {
  properties: Record<string, SchemaField>;
  required?: string[];
  $defs?: Record<string, SchemaField>;
};
type Forms = Record<string, { path: string; schema: FormSchema }>;
const label = (value: string) => value.replaceAll("_", " ");
const display = (value: unknown) =>
  value == null
    ? "Unknown"
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
async function request<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const response = await fetch("/api/v3/" + path, {
    method,
    headers: data
      ? { "Content-Type": "application/json", "X-Deep-Funding-Local": "1" }
      : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    const problem = result && typeof result === "object" ? (result as Row) : {};
    throw new Error(
      typeof problem.detail === "string"
        ? problem.detail
        : JSON.stringify(problem.detail || problem.error || "Request failed"),
    );
  }
  return result as T;
}

function RecordForm({
  table,
  forms,
  onSaved,
  onCancel,
}: {
  table: string;
  forms: Forms;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const definition = forms[table];
  const schema = definition.schema;
  const [values, setValues] = useState<Record<string, string>>({});
  const [references, setReferences] = useState<Record<string, Row[]>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const foreign: Record<string, string> = {
    owner_user_id: "users",
    user_id: "users",
    company_id: "companies",
    funding_provider_id: "funding-providers",
  };
  useEffect(() => {
    let alive = true;
    const paths = [
      ...new Set(
        Object.keys(schema.properties)
          .map((k) => foreign[k])
          .filter(Boolean),
      ),
    ];
    Promise.all(
      paths.map(async (path) => [path, await request<Row[]>(path)] as const),
    )
      .then((entries) => {
        if (alive) setReferences(Object.fromEntries(entries));
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [table]);
  function shape(field: SchemaField): SchemaField {
    if (field.$ref)
      return shape(schema.$defs?.[field.$ref.split("/").pop()!] || {});
    return field.anyOf
      ? shape(field.anyOf.find((item) => item.type !== "null") || {})
      : field;
  }
  const required = schema.required || [];
  function control(key: string) {
    const field = schema.properties[key],
      resolved = shape(field),
      ref = foreign[key];
    const value =
      values[key] ??
      (field.default == null
        ? ""
        : typeof field.default === "object"
          ? JSON.stringify(field.default)
          : String(field.default));
    const change = (text: string) => setValues((v) => ({ ...v, [key]: text }));
    return (
      <label
        key={key}
        className={
          ["object", "array"].includes(resolved.type || "") ? "wide-field" : ""
        }
      >
        {label(key)}
        {required.includes(key) ? " *" : ""}
        {ref ? (
          <select
            aria-label={label(key)}
            required={required.includes(key)}
            value={value}
            onChange={(e) => change(e.target.value)}
          >
            <option value="">Select record</option>
            {(references[ref] || []).map((row) => (
              <option key={String(row.id)} value={String(row.id)}>
                {String(
                  row.company_name || row.name || row.full_name || row.id,
                )}
              </option>
            ))}
          </select>
        ) : resolved.enum || resolved.type === "boolean" ? (
          <select
            aria-label={label(key)}
            value={value}
            required={required.includes(key)}
            onChange={(e) => change(e.target.value)}
          >
            <option value="">Unknown</option>
            {(resolved.enum || ["true", "false"]).map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </select>
        ) : ["object", "array"].includes(resolved.type || "") ? (
          <textarea
            aria-label={label(key)}
            value={value}
            rows={3}
            placeholder={resolved.type === "array" ? "[]" : "{}"}
            onChange={(e) => change(e.target.value)}
          />
        ) : (
          <input
            aria-label={label(key)}
            value={value}
            required={required.includes(key)}
            type={
              ["number", "integer"].includes(resolved.type || "")
                ? "number"
                : "text"
            }
            step={resolved.type === "integer" ? "1" : "any"}
            min={resolved.minimum}
            onChange={(e) => change(e.target.value)}
          />
        )}
      </label>
    );
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload: Row = {};
      for (const [key, field] of Object.entries(schema.properties)) {
        const text = values[key],
          type = shape(field).type;
        if (text == null) continue;
        if (text === "") {
          if (required.includes(key))
            throw new Error(label(key) + " is required");
          continue;
        }
        payload[key] = ["object", "array", "boolean"].includes(type || "")
          ? JSON.parse(text)
          : ["number", "integer"].includes(type || "")
            ? Number(text)
            : text;
      }
      await request(definition.path, "POST", payload);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save record");
    } finally {
      setBusy(false);
    }
  }
  const keys = Object.keys(schema.properties);
  const primary = keys.filter((key, i) => required.includes(key) || i < 10);
  return (
    <form className="database-form" onSubmit={(e) => void save(e)}>
      <h2>New {label(table)}</h2>
      <div className="database-fields">{primary.map(control)}</div>
      {keys.length > primary.length && (
        <details>
          <summary>Additional fields</summary>
          <div className="database-fields">
            {keys.filter((key) => !primary.includes(key)).map(control)}
          </div>
        </details>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="database-actions">
        <button type="submit" className="button" disabled={busy}>
          <Save size={16} />
          {busy ? "Saving..." : "Save record"}
        </button>
        <button type="button" className="text-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DatabaseWorkspace() {
  const [mode, setMode] = useState("loading"),
    [error, setError] = useState("");
  const [tables, setTables] = useState<Table[]>([]),
    [forms, setForms] = useState<Forms>({});
  const [table, setTable] = useState("companies"),
    [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0),
    [offset, setOffset] = useState(0);
  const [q, setQ] = useState(""),
    [sort, setSort] = useState("created_at"),
    [direction, setDirection] = useState("desc");
  const [filterField, setFilterField] = useState(""),
    [filterValue, setFilterValue] = useState("");
  const [revision, setRevision] = useState(0),
    [creating, setCreating] = useState(false),
    [selected, setSelected] = useState<Row | null>(null);
  const [companies, setCompanies] = useState<Row[]>([]),
    [providers, setProviders] = useState<Row[]>([]);
  const [company, setCompany] = useState(""),
    [provider, setProvider] = useState(""),
    [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let alive = true;
    request<{ mode: string }>("health")
      .then((v) => {
        if (alive) setMode(v.mode);
      })
      .catch((e) => {
        if (alive) {
          setMode("error");
          setError(e.message);
        }
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (mode !== "local-private") return;
    let alive = true;
    Promise.all([
      request<{ tables: Table[] }>("database"),
      request<Forms>("database-forms"),
      request<Row[]>("companies"),
      request<Row[]>("funding-providers"),
    ])
      .then(([metadata, definitions, cp, fp]) => {
        if (alive) {
          setTables(metadata.tables);
          setForms(definitions);
          setCompanies(cp);
          setProviders(fp);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [mode, revision]);
  useEffect(() => {
    if (mode !== "local-private") return;
    let alive = true;
    const params = new URLSearchParams({
      q,
      sort,
      direction,
      offset: String(offset),
      limit: "25",
      filter_field: filterField,
      filter_value: filterValue,
    });
    setError("");
    request<{ records: Row[]; total: number }>(`database/${table}?${params}`)
      .then((v) => {
        if (alive) {
          setRows(v.records);
          setTotal(v.total);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [
    mode,
    table,
    q,
    sort,
    direction,
    offset,
    filterField,
    filterValue,
    revision,
  ]);
  const columns = tables.find((t) => t.name === table)?.columns || [];
  const visible = [
    "id",
    ...columns
      .filter((key) => !["id", "created_at", "updated_at"].includes(key))
      .slice(0, 4),
    "created_at",
  ];
  function choose(name: string) {
    setTable(name);
    setOffset(0);
    setQ("");
    setSort("created_at");
    setFilterField("");
    setFilterValue("");
    setCreating(false);
    setSelected(null);
  }
  async function run() {
    setRunning(true);
    setError("");
    try {
      const result = await request<Row>("matches/generate", "POST", {
        company_id: company,
        funding_provider_id: provider,
      });
      choose("matches");
      setSelected(result);
      setRevision((v) => v + 1);
      setNotice("Match saved. Human review required.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    } finally {
      setRunning(false);
    }
  }
  return (
    <main className="database-page">
      <div className="knowledge-heading">
        <div>
          <p className="eyebrow">DEEP FUNDING / PRIVATE WORKSPACE</p>
          <h1>Database explorer</h1>
        </div>
        <nav className="knowledge-tabs">
          <Link to="/knowledge/funding">Funding knowledge</Link>
          <Link to="/knowledge/compliance">Compliance knowledge</Link>
        </nav>
      </div>
      {mode === "loading" && <p role="status">Checking workspace...</p>}
      {error && <p role="alert">{error}</p>}
      {mode === "public-knowledge" && (
        <div className="database-notice">
          <h2>Private database is local</h2>
          <p>
            Cloudflare hosts public knowledge. Company records and saved matches
            stay in the Python/SQLite workspace on your machine.
          </p>
          <a
            className="button"
            href="http://127.0.0.1:8793/data-explorer"
            target="_blank"
            rel="noreferrer"
          >
            Open local database <ExternalLink size={16} />
          </a>
          <p>
            <a
              href="https://github.com/pengpengyi92/deep-funding#private-database-v03"
              target="_blank"
              rel="noreferrer"
            >
              Local setup
            </a>
          </p>
          <p className="muted">
            Hosted private accounts and multi-tenant authentication: not
            deployed.
          </p>
        </div>
      )}
      {mode === "local-private" && (
        <>
          <div className="knowledge-summary">
            <Database size={19} />
            <strong>SQLite / persistent</strong>
            <span>Single-owner loopback workspace</span>
            <a href="/docs" target="_blank" rel="noreferrer">
              API docs
            </a>
            <a
              href="https://pengyi-deep-funding.pengpengyi92.workers.dev/rsi"
              target="_blank"
              rel="noreferrer"
            >
              RSI workspace
            </a>
          </div>
          <section aria-label="Generate persisted match">
            <div className="database-toolbar">
              <label>
                Company
                <select
                  aria-label="Match company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                >
                  <option value="">Select company</option>
                  {companies.map((r) => (
                    <option key={String(r.id)} value={String(r.id)}>
                      {String(r.company_name)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Funding provider
                <select
                  aria-label="Match provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  <option value="">Select provider</option>
                  {providers.map((r) => (
                    <option key={String(r.id)} value={String(r.id)}>
                      {String(r.name)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button"
                disabled={!company || !provider || running}
                onClick={() => void run()}
              >
                <Play size={16} />
                {running ? "Matching..." : "Generate match"}
              </button>
            </div>
          </section>
          {notice && <p role="status">{notice}</p>}
          <nav className="database-tabs" aria-label="Database tables">
            {tables.map((t) => (
              <button
                key={t.name}
                aria-pressed={t.name === table}
                onClick={() => choose(t.name)}
              >
                {label(t.name)} ({t.count})
              </button>
            ))}
          </nav>
          <div className="database-toolbar">
            <label>
              Search records
              <input
                aria-label="Search records"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOffset(0);
                }}
              />
            </label>
            <label>
              Sort
              <select
                aria-label="Sort records"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {columns.map((key) => (
                  <option key={key}>{key}</option>
                ))}
              </select>
            </label>
            <label>
              Order
              <select
                aria-label="Sort direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
            <label>
              Filter field
              <select
                aria-label="Filter field"
                value={filterField}
                onChange={(e) => {
                  setFilterField(e.target.value);
                  setOffset(0);
                }}
              >
                <option value="">None</option>
                {columns.map((key) => (
                  <option key={key}>{key}</option>
                ))}
              </select>
            </label>
            {filterField && (
              <label>
                Exact value
                <input
                  aria-label="Filter value"
                  value={filterValue}
                  onChange={(e) => {
                    setFilterValue(e.target.value);
                    setOffset(0);
                  }}
                />
              </label>
            )}
            <button
              className="icon-button"
              title="Refresh database"
              aria-label="Refresh database"
              onClick={() => setRevision((v) => v + 1)}
            >
              <RefreshCw size={17} />
            </button>
            {forms[table] && (
              <button className="button" onClick={() => setCreating(true)}>
                <Plus size={17} /> New record
              </button>
            )}
          </div>
          {creating && forms[table] && (
            <RecordForm
              key={table}
              table={table}
              forms={forms}
              onSaved={() => {
                setCreating(false);
                setRevision((v) => v + 1);
                setNotice("Record saved to local database.");
              }}
              onCancel={() => setCreating(false)}
            />
          )}
          <div className="database-table">
            <table>
              <thead>
                <tr>
                  {visible.map((key) => (
                    <th key={key}>{label(key)}</th>
                  ))}
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={String(row.id)}>
                    {visible.map((key) => (
                      <td key={key}>{display(row[key]).slice(0, 150)}</td>
                    ))}
                    <td>
                      <button
                        aria-label={`Inspect ${row.id}`}
                        onClick={() => setSelected(row)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && <p>No records found.</p>}
          <div className="database-pagination">
            <button
              className="icon-button"
              title="Previous page"
              aria-label="Previous page"
              disabled={offset === 0}
              onClick={() => setOffset((v) => Math.max(0, v - 25))}
            >
              <ArrowLeft size={16} />
            </button>
            <span>
              {total ? offset + 1 : 0}-{Math.min(offset + 25, total)} / {total}
            </span>
            <button
              className="icon-button"
              title="Next page"
              aria-label="Next page"
              disabled={offset + 25 >= total}
              onClick={() => setOffset((v) => v + 25)}
            >
              <ArrowRight size={16} />
            </button>
          </div>
          {selected && (
            <section className="database-detail" aria-label="Record detail">
              <div className="knowledge-heading">
                <h2>Record detail</h2>
                <button
                  className="icon-button"
                  title="Close detail"
                  aria-label="Close detail"
                  onClick={() => setSelected(null)}
                >
                  <X size={17} />
                </button>
              </div>
              <pre>{JSON.stringify(selected, null, 2)}</pre>
            </section>
          )}
        </>
      )}
    </main>
  );
}
