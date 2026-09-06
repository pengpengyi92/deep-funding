import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Workflow,
  Building2,
  Landmark,
  ShieldCheck,
  Search,
  Play,
  Activity,
  FileText,
  Check,
  AlertTriangle,
  LockKeyhole,
  Download,
  Trash2,
  Plus,
  LoaderCircle,
  GitBranch,
  ChevronDown,
  Send,
} from "lucide-react";
import {
  stages,
  regions,
  sectors,
  capitalTypes,
  resources,
  visibility,
  type Company,
  type Funder,
  type Profile,
  type Match,
  type Run,
  type Handoff,
} from "../../../packages/schemas";
import "./style.css";
import { compareMatches, matchIsStale } from "../../../packages/matching";
import { FundingExplorer } from "./funding-explorer";
import { RsiWorkspace } from "./rsi-workspace";
import { CompanyReadinessFields } from "./company-readiness-fields";
import { KnowledgeWorkspace } from "./knowledge-workspace";
import { DatabaseWorkspace } from "./database-workspace";
import { fundingProfileOf } from "../../../packages/knowledge/adapter";
import { stageOf } from "../../../packages/knowledge/readiness";

type Workspace = {
  companies: Profile<Company>[];
  funders: Profile<Funder>[];
  matches: Match[];
  requests: Handoff[];
  expiresAt: string;
};
type AppContext = {
  ws: Workspace | null;
  busy: boolean;
  error: string;
  act: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  refresh: () => Promise<Workspace>;
  init: () => Promise<Workspace>;
};
const Context = createContext<AppContext>(null!);
const useApp = () => useContext(Context);
async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const r = await fetch(`/api${path}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const result: unknown = await r.json();
  if (!r.ok)
    throw new Error(
      result && typeof result === "object" && "error" in result
        ? String(result.error)
        : `Request failed: ${r.status}`,
    );
  return result as T;
}
function Provider({ children }: { children: ReactNode }) {
  const [ws, setWs] = useState<Workspace | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const initializing = useRef<Promise<Workspace> | null>(null);
  async function refresh() {
    const state = await api<Workspace>("/workspace");
    setWs(state);
    return state;
  }
  function init() {
    if (!initializing.current)
      initializing.current = (async () => {
        await api("/workspace", "POST");
        return refresh();
      })().finally(() => {
        initializing.current = null;
      });
    return initializing.current;
  }
  async function act<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ ws, busy, error, act, refresh, init }}>
      {children}
    </Context.Provider>
  );
}
const date = (s: string) =>
  new Date(s).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
const money = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: v >= 1e6 ? "compact" : "standard",
  }).format(v);
const label = (s: string) => s.toLowerCase().replaceAll("_", " ");
function Badge({ value }: { value: string }) {
  return (
    <span
      className={`badge ${value === "INTRODUCTION_READY" || value === "REVIEWABLE" ? "good" : value === "REJECTED" ? "bad" : "neutral"}`}
    >
      {label(value)}
    </span>
  );
}
function BusyButton({
  children,
  onClick,
  className = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const { busy } = useApp();
  return (
    <button className={className} disabled={busy || disabled} onClick={onClick}>
      {busy ? <LoaderCircle className="spin" size={17} /> : null}
      {children}
    </button>
  );
}
function DownloadButton({ data, name }: { data: unknown; name: string }) {
  return (
    <button
      className="icon-button"
      title="Download JSON"
      aria-label="Download JSON"
      onClick={() => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download size={18} />
    </button>
  );
}
function Header() {
  const local =
    document
      .querySelector('meta[name="deep-funding-runtime"]')
      ?.getAttribute("content") === "local-private";
  const runtimeLink = (to: string, title: string) =>
    local ? (
      <a
        href={`https://pengyi-deep-funding.pengpengyi92.workers.dev${to}`}
        target="_blank"
        rel="noreferrer"
      >
        {title}
      </a>
    ) : (
      <NavLink to={to}>{title}</NavLink>
    );
  return (
    <header className="header">
      <Link to="/" className="brand">
        <Workflow size={25} />
        <span>
          Deep Funding<span className="version"> / 0.3</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        {runtimeLink("/founder/dashboard", "Company")}
        {runtimeLink("/funding/dashboard", "Capital")}
        {runtimeLink("/funding/explorer", "Explorer")}
        <NavLink to="/rsi">RSI</NavLink>
        <NavLink to="/knowledge/funding">Knowledge</NavLink>
        <NavLink to="/data-explorer">Database</NavLink>
        <NavLink to="/about">Protocol</NavLink>
        <a
          className="github-link"
          href="https://github.com/pengpengyi92/deep-funding"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ArrowUpRight size={15} />
        </a>
      </nav>
    </header>
  );
}
function Footer() {
  return (
    <footer>
      <Link to="/" className="brand">
        <Workflow size={19} /> Deep Funding
      </Link>
      <span>Open source. Evidence first. Humans decide.</span>
      <span>Public sources / fictional demos · No investment advice</span>
    </footer>
  );
}
function PageHead({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </div>
      {action && <div className="head-actions">{action}</div>}
    </div>
  );
}
function Landing() {
  const { act, init, refresh } = useApp();
  const navigate = useNavigate();
  async function demoRun() {
    await act(async () => {
      let w = await init();
      if (!w.companies.length && !w.funders.length) {
        await api("/workspace/demo", "POST");
        w = await refresh();
      }
      if (!w.companies.length) {
        navigate("/founder/onboarding");
        return;
      }
      const matches = await api<Match[]>(
        `/companies/${w.companies[0].id}/matches`,
        "POST",
      );
      await refresh();
      navigate(`/match/${matches[0].id}`);
    });
  }
  return (
    <>
      <section className="hero">
        <img
          src="/meeting-room.png"
          alt="Entrepreneurs and capital partners meeting across a sunlit conference table"
          fetchPriority="high"
        />
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" /> OPEN-SOURCE A2A FUNDING INFRASTRUCTURE
          </p>
          <h1>
            Deep Funding
            <span>
              Capital meets
              <br />
              companies.
            </span>
          </h1>
          <p>
            Company wants the right capital.
            <br />
            Capital wants the right company.
            <br />
            <strong>Let their agents meet first.</strong>
          </p>
          <div className="hero-actions">
            <Link className="button" to="/founder/onboarding">
              I need funding <ArrowUpRight size={18} />
            </Link>
            <Link className="button white" to="/funding/onboarding">
              I provide funding <ArrowUpRight size={18} />
            </Link>
          </div>
          <BusyButton className="text-button" onClick={demoRun}>
            <Play size={15} /> Run the A2A demo <ArrowRight size={16} />
          </BusyButton>
        </div>
        <span className="hero-caption">
          THE RIGHT CONVERSATION STARTS WITH THE RIGHT FIT.
        </span>
      </section>
      <section className="process-band">
        <div className="process-intro">
          <p className="eyebrow">BEFORE THE FIRST MEETING</p>
          <h2>
            Less guesswork. <br />
            Better introductions.
          </h2>
        </div>
        {[
          ["01", "Information", "Structured profiles, with sources."],
          ["02", "Analysis", "Needs meet a capital mandate."],
          ["03", "Audit", "Evidence gaps stay visible."],
          ["04", "Match", "Bilateral fit. A human next step."],
        ].map(([n, t, s]) => (
          <div className="process-step" key={n}>
            <span>{n}</span>
            <h3>{t}</h3>
            <p>{s}</p>
          </div>
        ))}
      </section>
      <section className="architecture">
        <div>
          <p className="eyebrow">TWO SIDES. ONE SHARED PROTOCOL.</p>
          <h2>
            Agents do the screening.
            <br />
            People build the relationship.
          </h2>
          <p className="muted">
            A match is a starting point, not an investment decision.
          </p>
        </div>
        <div className="lanes">
          {[
            ["Company Agent", "Founder / enterprise", "/founder/dashboard"],
            ["Funding Agent", "Angel / VC / PE / bank", "/funding/dashboard"],
          ].map(([t, s, url]) => (
            <div className="lane" key={t}>
              <Link to={url}>
                <span>{s}</span>
                <h3>
                  {t} <ArrowUpRight size={19} />
                </h3>
              </Link>
              <div className="lane-steps">
                {["Information", "Analysis", "Audit", "Match"].map((v, i) => (
                  <span key={v}>
                    <b>0{i + 1}</b>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <Link className="protocol-link" to="/about">
            <GitBranch size={19} /> A2A Match Protocol v1.0{" "}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
function WorkspaceGuard({ children }: { children: ReactNode }) {
  const { ws, act, init } = useApp();
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void act(init);
    }
  }, []);
  return ws ? (
    <>{children}</>
  ) : (
    <div className="empty">
      <LoaderCircle className="spin" />
      <h2>Opening your workspace</h2>
      <BusyButton className="button white" onClick={() => void act(init)}>
        Retry
      </BusyButton>
    </div>
  );
}
function WorkspaceNav({ side }: { side: "founder" | "funding" }) {
  const { ws, act } = useApp();
  return (
    <>
      <div className="workspace-strip">
        <span>
          <LockKeyhole size={14} /> Private browser workspace
        </span>
        <span>
          Fictional demo only · Expires{" "}
          {ws ? new Date(ws.expiresAt).toLocaleDateString() : ""}
        </span>
        <Link to="/about#privacy">Data & privacy</Link>
      </div>
      <div className="workspace-nav">
        <nav aria-label="Workspace navigation">
          <NavLink to={`/${side}/dashboard`}>Overview</NavLink>
          <NavLink to={`/${side}/profile`}>
            {side === "founder" ? "Company profiles" : "Capital mandates"}
          </NavLink>
          <NavLink to={`/${side}/matches`}>Matches</NavLink>
        </nav>
        <div className="inline">
          <DownloadButton data={ws} name="deep-funding-workspace" />
          <button
            className="icon-button danger"
            title="Delete workspace"
            aria-label="Delete workspace"
            onClick={() => {
              if (
                confirm(
                  "Permanently delete all profiles, matches and traces in this browser workspace?",
                )
              )
                void act(async () => {
                  await api("/workspace", "DELETE");
                  window.location.assign("/");
                });
            }}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </>
  );
}
function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <FileText size={28} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
function Dashboard({ side }: { side: "founder" | "funding" }) {
  const { ws, act, refresh } = useApp();
  const navigate = useNavigate();
  const list = side === "founder" ? ws!.companies : ws!.funders;
  const latest = latestMatches(ws!.matches);
  async function run(id: string) {
    await act(async () => {
      await api(
        `/${side === "founder" ? "companies" : "funders"}/${id}/matches`,
        "POST",
      );
      await refresh();
      navigate(`/${side}/matches`);
    });
  }
  return (
    <>
      <WorkspaceNav side={side} />
      <main className="workspace">
        <PageHead
          eyebrow={
            side === "founder" ? "COMPANY WORKSPACE" : "CAPITAL WORKSPACE"
          }
          title={
            side === "founder"
              ? "Find your capital fit."
              : "Meet your next company."
          }
          action={
            <Link className="button" to={`/${side}/onboarding`}>
              <Plus size={17} />{" "}
              {side === "founder" ? "New company" : "New mandate"}
            </Link>
          }
        >
          <p className="muted">
            Information → Analysis → Audit → Match → Human review
          </p>
        </PageHead>
        <div className="metrics">
          <div>
            <span>Profiles</span>
            <strong>{list.length.toString().padStart(2, "0")}</strong>
          </div>
          <div>
            <span>Latest pairs</span>
            <strong>{latest.length.toString().padStart(2, "0")}</strong>
          </div>
          <div>
            <span>Ready for review</span>
            <strong>
              {latest
                .filter(
                  (m) =>
                    m.decision === "INTRODUCTION_READY" && !isStale(m, ws!),
                )
                .length.toString()
                .padStart(2, "0")}
            </strong>
          </div>
          <div>
            <span>Human requests</span>
            <strong>
              {ws!.requests
                .filter((r) => r.kind === "introduction")
                .length.toString()
                .padStart(2, "0")}
            </strong>
          </div>
        </div>
        {!ws!.companies.length && !ws!.funders.length ? (
          <Empty title="Start with a fictional deal">
            <p>
              One AI company. Five funding mandates. Strong fits, hard
              rejections and missing evidence.
            </p>
            <BusyButton
              onClick={() =>
                void act(async () => {
                  await api("/workspace/demo", "POST");
                  await refresh();
                })
              }
            >
              <Play size={17} /> Load demo profiles
            </BusyButton>
          </Empty>
        ) : (
          <>
            <div className="section-heading">
              <h2>{side === "founder" ? "Companies" : "Funding mandates"}</h2>
              <span className="muted">{list.length} profiles</span>
            </div>
            <div className="profile-list">
              {list.map((p) => (
                <div className="profile-row" key={p.id}>
                  <div className="entity-icon">
                    {side === "founder" ? <Building2 /> : <Landmark />}
                  </div>
                  <div className="entity-main">
                    <Link to={`/${side}/profile?edit=${p.id}`}>
                      <h3>{p.data.name}</h3>
                    </Link>
                    <p>
                      {p.data.location} · Version {p.version}
                    </p>
                  </div>
                  <div className="profile-meta">
                    {"raiseUsd" in p.data ? (
                      <>
                        <b>{money(p.data.raiseUsd)}</b>
                        <span>
                          {stageOf(p.data) ?? "Unknown stage"} / {p.data.sector}
                        </span>
                      </>
                    ) : (
                      <>
                        <b>
                          {fundingProfileOf(p.data).provides_capital === false
                            ? "Resources only"
                            : fundingProfileOf(p.data).ticket_usd
                              ? `${money(fundingProfileOf(p.data).ticket_usd!.min)}–${money(fundingProfileOf(p.data).ticket_usd!.max)}`
                              : "Unknown ticket"}
                        </b>
                        <span>
                          {fundingProfileOf(p.data).categories.join(" / ")} /{" "}
                          {fundingProfileOf(p.data).target_stages?.join(", ") ||
                            "Unknown stages"}
                        </span>
                      </>
                    )}
                  </div>
                  <BusyButton
                    className="button white"
                    onClick={() => run(p.id)}
                  >
                    <Workflow size={17} /> Run agents
                  </BusyButton>
                </div>
              ))}
            </div>
            {!list.length && (
              <Empty title="No profiles on this side yet">
                <Link to={`/${side}/onboarding`} className="button">
                  Create profile <Plus size={17} />
                </Link>
              </Empty>
            )}
          </>
        )}
        <div className="section-heading">
          <h2>Human handoff queue</h2>
          <span className="badge neutral">No outbound messages</span>
        </div>
        {!ws!.requests.length ? (
          <p className="muted empty-line">
            No handoffs recorded. Open a match to review and request the next
            step.
          </p>
        ) : (
          <div className="handoff-list">
            {ws!.requests.map((r) => (
              <Link key={r.id} to={`/match/${r.matchId}`}>
                <div>
                  <Badge value={r.kind} />
                  <p>{r.note}</p>
                  <span className="muted">
                    {date(r.createdAt)} · Recorded, not sent
                  </span>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
function latestMatches(matches: Match[]) {
  const seen = new Set<string>();
  return matches.filter((m) => {
    const key = m.companyId + m.funderId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function isStale(m: Match, ws: Workspace) {
  return matchIsStale(
    m,
    ws.companies.find((c) => c.id === m.companyId)?.version,
    ws.funders.find((f) => f.id === m.funderId)?.version,
  );
}
function Matches({ side }: { side: "founder" | "funding" }) {
  const { ws } = useApp();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("ALL");
  const rows = latestMatches(ws!.matches)
    .filter(
      (m) =>
        (filter === "ALL" || m.decision === filter) &&
        `${m.companyName} ${m.funderName}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort(compareMatches);
  return (
    <>
      <WorkspaceNav side={side} />
      <main className="workspace">
        <PageHead
          eyebrow="A2A MATCH LAYER"
          title="Every fit has a reason."
          action={<DownloadButton data={rows} name="deep-funding-matches" />}
        >
          <p className="muted">
            Hard constraints first. Evidence gaps second. Weighted fit third.
          </p>
        </PageHead>
        <div className="filters">
          <label className="search">
            <Search size={18} />
            <input
              aria-label="Search matches"
              placeholder="Search companies or capital"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Match decision"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              "ALL",
              "INTRODUCTION_READY",
              "REQUEST_MORE_INFORMATION",
              "REJECTED",
              "LOW_FIT",
            ].map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </select>
        </div>
        <div className="match-list">
          {rows.map((m) => (
            <Link className="match-row" key={m.id} to={`/match/${m.id}`}>
              <div className="score-small">
                <strong>{m.score}</strong>
                <span>/ 100</span>
              </div>
              <div className="match-main">
                <h3>{side === "founder" ? m.funderName : m.companyName}</h3>
                <p>
                  {side === "founder" ? m.companyName : m.funderName} ·{" "}
                  {isStale(m, ws!)
                    ? "Stale: rerun required"
                    : date(m.createdAt)}
                </p>
                <span className="muted">
                  {m.hardFailures[0] ??
                    m.gaps[0] ??
                    m.dimensions.find((d) => d.name === "Strategic")?.reason}
                </span>
              </div>
              <Badge value={m.decision} />
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
        {!rows.length && (
          <Empty title="No matches here yet">
            <Link to={`/${side}/dashboard`} className="button white">
              Back to workspace <ArrowRight size={17} />
            </Link>
          </Empty>
        )}
      </main>
    </>
  );
}

const blankCompany: Company = {
  name: "",
  description: "",
  location: "",
  website: "",
  stage: "Seed",
  region: "Greater China",
  sector: "AI",
  raiseUsd: 1500000,
  capitalTypes: ["VC"],
  mrrUsd: null,
  customers: null,
  teamSize: 3,
  technicalTeam: null,
  workingProduct: null,
  useOfFunds: "",
  strategicNeeds: [],
  shareForMatching: false,
  privateNotes: "",
  evidence: [],
};
const blankFunder: Funder = {
  name: "",
  description: "",
  location: "",
  website: "",
  capitalType: "VC",
  stages: ["Seed"],
  regions: ["Greater China"],
  sectors: ["AI"],
  excludedSectors: [],
  ticketMinUsd: 500000,
  ticketMaxUsd: 3000000,
  minimumMrrUsd: 0,
  requiresProduct: true,
  requiresTechnicalTeam: false,
  strategicResources: [],
  shareForMatching: false,
  privateNotes: "",
  evidence: [],
};
function Field({
  label: txt,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{txt}</span>
      {children}
    </label>
  );
}
function Chips({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="choices">
      <legend>{title}</legend>
      {options.map((o) => (
        <label key={o}>
          <input
            type="checkbox"
            checked={value.includes(o)}
            onChange={(e) =>
              onChange(
                e.target.checked ? [...value, o] : value.filter((v) => v !== o),
              )
            }
          />
          {o}
        </label>
      ))}
    </fieldset>
  );
}
function Profiles({
  side,
  onboarding = false,
}: {
  side: "founder" | "funding";
  onboarding?: boolean;
}) {
  const { ws, act, refresh } = useApp();
  const navigate = useNavigate(),
    location = useLocation();
  const list = side === "founder" ? ws!.companies : ws!.funders;
  const id =
    new URLSearchParams(location.search).get("edit") ??
    (!onboarding ? list[0]?.id : undefined);
  const current = list.find((p) => p.id === id);
  const [form, setForm] = useState<Company | Funder>(
      structuredClone(
        current?.data ?? (side === "founder" ? blankCompany : blankFunder),
      ),
    ),
    [agentResult, setAgentResult] = useState<{
      result: unknown;
      runId: string;
    } | null>(null);
  useEffect(() => {
    setForm(
      structuredClone(
        current?.data ?? (side === "founder" ? blankCompany : blankFunder),
      ),
    );
    setAgentResult(null);
  }, [side, id, current?.version, onboarding]);
  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  const input = (key: string, type = "text") => (
    <input
      type={type}
      required={key !== "website"}
      maxLength={type === "text" ? 250 : undefined}
      min={type === "number" ? 0 : undefined}
      step={type === "number" ? "any" : undefined}
      value={(form as unknown as Record<string, string | number>)[key] ?? ""}
      onChange={(e) =>
        set(key, type === "number" ? Number(e.target.value) : e.target.value)
      }
    />
  );
  const select = (key: string, options: readonly string[]) => (
    <select
      value={(form as unknown as Record<string, string>)[key]}
      onChange={(e) => set(key, e.target.value)}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
  const nullableNumber = (key: "mrrUsd" | "customers") => (
    <input
      type="number"
      min="0"
      step={key === "customers" ? "1" : "any"}
      placeholder="Unknown"
      value={"mrrUsd" in form ? (form[key] ?? "") : ""}
      onChange={(e) =>
        set(key, e.target.value === "" ? null : Number(e.target.value))
      }
    />
  );
  const truth = (key: "technicalTeam" | "workingProduct") => (
    <select
      value={"mrrUsd" in form ? String(form[key]) : "null"}
      onChange={(e) =>
        set(key, e.target.value === "null" ? null : e.target.value === "true")
      }
    >
      <option value="null">Unknown</option>
      <option value="true">Yes, reported</option>
      <option value="false">No</option>
    </select>
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    await act(async () => {
      const p = await api<Profile<Company | Funder>>(
        `/${side === "founder" ? "companies" : "funders"}${current ? `/${current.id}` : ""}`,
        current ? "PUT" : "POST",
        form,
      );
      await refresh();
      navigate(`/${side}/profile?edit=${p.id}`);
    });
  }
  return (
    <>
      <WorkspaceNav side={side} />
      <main className="workspace">
        <PageHead
          eyebrow={onboarding ? "ONBOARDING" : "PROFILE & EVIDENCE"}
          title={
            onboarding
              ? side === "founder"
                ? "Build your company profile."
                : "Define your capital mandate."
              : form.name || "Your profile"
          }
          action={
            current ? <Badge value={`VERSION ${current.version}`} /> : undefined
          }
        >
          <p className="muted">
            Demo workspace. Use fictional data, not confidential deal materials.
            All amounts are USD.
          </p>
        </PageHead>
        {!onboarding && list.length > 1 && (
          <div className="profile-tabs">
            {list.map((p) => (
              <Link
                className={p.id === id ? "selected" : ""}
                key={p.id}
                to={`/${side}/profile?edit=${p.id}`}
              >
                {p.data.name}
              </Link>
            ))}
          </div>
        )}
        <form onSubmit={save} className="profile-form">
          <section>
            <h2>
              <span>01</span> Identity
            </h2>
            <div className="form-grid">
              <Field label="Name">{input("name")}</Field>
              <Field label="Location">{input("location")}</Field>
              <Field label="Website (optional)">
                {input("website", "url")}
              </Field>
              <Field label="Description">
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </div>
          </section>
          {"raiseUsd" in form ? (
            <>
              <section>
                <h2>
                  <span>02</span> Company & funding request
                </h2>
                <div className="form-grid">
                  <Field label="Stage">{select("stage", stages)}</Field>
                  <Field label="Region">{select("region", regions)}</Field>
                  <Field label="Sector">{select("sector", sectors)}</Field>
                  <Field label="Requested ticket, USD (single provider)">
                    {input("raiseUsd", "number")}
                  </Field>
                  <Field label="Monthly recurring revenue, USD">
                    {nullableNumber("mrrUsd")}
                  </Field>
                  <Field label="Customers / design partners">
                    {nullableNumber("customers")}
                  </Field>
                  <Field label="Team size">{input("teamSize", "number")}</Field>
                  <Field label="Technical founding team">
                    {truth("technicalTeam")}
                  </Field>
                  <Field label="Working product">
                    {truth("workingProduct")}
                  </Field>
                  <Field label="Use of funds">
                    <textarea
                      required
                      minLength={5}
                      maxLength={1000}
                      value={form.useOfFunds}
                      onChange={(e) => set("useOfFunds", e.target.value)}
                    />
                  </Field>
                </div>
                <CompanyReadinessFields
                  value={form}
                  onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                />
                <Chips
                  title="Legacy provider categories (unless explicit categories are set)"
                  options={capitalTypes}
                  value={form.capitalTypes}
                  onChange={(v) => set("capitalTypes", v)}
                />
                <Chips
                  title="Strategic resources needed"
                  options={resources}
                  value={form.strategicNeeds}
                  onChange={(v) => set("strategicNeeds", v)}
                />
              </section>
            </>
          ) : form.fundingProfile ? (
            <section>
              <h2>
                <span>02</span> Catalogue mandate
              </h2>
              <p>
                Source status: {form.fundingProfile.source_metadata.status}.
                Policy: {form.fundingProfile.policy_id}.
              </p>
              <dl className="catalogue-facts">
                <div>
                  <dt>Categories</dt>
                  <dd>{form.fundingProfile.categories.join(" / ")}</dd>
                </div>
                <div>
                  <dt>Capital</dt>
                  <dd>
                    {form.fundingProfile.provides_capital === false
                      ? "Resources only"
                      : form.fundingProfile.ticket_usd
                        ? JSON.stringify(form.fundingProfile.ticket_usd)
                        : "Unknown ticket"}
                  </dd>
                </div>
                <div>
                  <dt>Stages</dt>
                  <dd>
                    {form.fundingProfile.target_stages?.join(", ") || "Unknown"}
                  </dd>
                </div>
              </dl>
              <details>
                <summary>Canonical funding profile</summary>
                <pre>{JSON.stringify(form.fundingProfile, null, 2)}</pre>
              </details>
              <Link
                to={`/funding/explorer?entity=${form.fundingProfile.slug}`}
                className="text-button"
              >
                Source profile <ArrowUpRight size={16} />
              </Link>
            </section>
          ) : (
            <section>
              <h2>
                <span>02</span> Investment mandate
              </h2>
              <div className="form-grid">
                <Field label="Capital type">
                  {select("capitalType", capitalTypes)}
                </Field>
                <Field label="Minimum ticket, USD">
                  {input("ticketMinUsd", "number")}
                </Field>
                <Field label="Maximum ticket, USD">
                  {input("ticketMaxUsd", "number")}
                </Field>
                <Field label="Minimum monthly revenue, USD">
                  {input("minimumMrrUsd", "number")}
                </Field>
              </div>
              <Chips
                title="Stages (hard constraint)"
                options={stages}
                value={form.stages}
                onChange={(v) => set("stages", v)}
              />
              <Chips
                title="Regions (hard constraint)"
                options={regions}
                value={form.regions}
                onChange={(v) => set("regions", v)}
              />
              <Chips
                title="Preferred sectors (scoring)"
                options={sectors}
                value={form.sectors}
                onChange={(v) => set("sectors", v)}
              />
              <Chips
                title="Excluded sectors (hard constraint)"
                options={sectors}
                value={form.excludedSectors}
                onChange={(v) => set("excludedSectors", v)}
              />
              <Chips
                title="Available strategic resources"
                options={resources}
                value={form.strategicResources}
                onChange={(v) => set("strategicResources", v)}
              />
              <div className="checkline">
                <label>
                  <input
                    type="checkbox"
                    checked={form.requiresProduct ?? false}
                    onChange={(e) => set("requiresProduct", e.target.checked)}
                  />{" "}
                  Working product required
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.requiresTechnicalTeam ?? false}
                    onChange={(e) =>
                      set("requiresTechnicalTeam", e.target.checked)
                    }
                  />{" "}
                  Technical founding team required
                </label>
              </div>
            </section>
          )}
          <section>
            <h2>
              <span>03</span> Evidence register
            </h2>
            <p className="muted">
              Source claims remain PROVIDED, not independently verified. Private
              and NDA-required evidence is excluded from matching.
            </p>
            <div className="evidence-editor">
              {form.evidence.map((ev, i) => {
                const change = (key: string, value: string) =>
                  set(
                    "evidence",
                    form.evidence.map((old, j) =>
                      j === i ? { ...old, [key]: value } : old,
                    ),
                  );
                return (
                  <div className="evidence-item" key={ev.id}>
                    <div className="form-grid">
                      <Field label="Supports">
                        <select
                          value={ev.field}
                          onChange={(e) => change("field", e.target.value)}
                        >
                          {(side === "founder"
                            ? ["product", "traction", "team", "financials"]
                            : ["mandate"]
                          ).map((f) => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Evidence title">
                        <input
                          required
                          maxLength={250}
                          value={ev.label}
                          onChange={(e) => change("label", e.target.value)}
                        />
                      </Field>
                      <Field label="Source reference (no uploads)">
                        <input
                          required
                          maxLength={500}
                          value={ev.source}
                          onChange={(e) => change("source", e.target.value)}
                        />
                      </Field>
                      <Field label="Observed date">
                        <input
                          type="date"
                          required
                          value={ev.observedAt}
                          onChange={(e) => change("observedAt", e.target.value)}
                        />
                      </Field>
                      <Field label="Visibility">
                        <select
                          value={ev.visibility}
                          onChange={(e) => change("visibility", e.target.value)}
                        >
                          {visibility.map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Provenance">
                        <select
                          value={ev.provenance}
                          onChange={(e) => change("provenance", e.target.value)}
                        >
                          <option>PROVIDED</option>
                          <option>UNKNOWN</option>
                        </select>
                      </Field>
                    </div>
                    <button
                      type="button"
                      className="icon-button danger"
                      title="Remove evidence"
                      aria-label="Remove evidence"
                      onClick={() =>
                        set(
                          "evidence",
                          form.evidence.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="button white"
              disabled={form.evidence.length >= 20}
              onClick={() =>
                set("evidence", [
                  ...form.evidence,
                  {
                    id: crypto.randomUUID(),
                    field: side === "founder" ? "product" : "mandate",
                    label: "",
                    source: "",
                    observedAt: new Date().toISOString().slice(0, 10),
                    visibility: "MATCH_ONLY",
                    provenance: "PROVIDED",
                  },
                ])
              }
            >
              <Plus size={16} /> Add evidence
            </button>
          </section>
          <section>
            <h2>
              <span>04</span> Privacy & consent
            </h2>
            <Field label="Private notes (not included in matching)">
              <textarea
                maxLength={3000}
                value={form.privateNotes}
                onChange={(e) => set("privateNotes", e.target.value)}
              />
            </Field>
            <label className="consent">
              <input
                type="checkbox"
                checked={form.shareForMatching}
                onChange={(e) => set("shareForMatching", e.target.checked)}
              />{" "}
              Allow this profile's core fields and PUBLIC / MATCH_ONLY evidence
              to be used in this workspace's A2A matching.
            </label>
          </section>
          <div className="form-actions">
            <BusyButton>
              <Check size={17} />{" "}
              {current ? "Save new version" : "Create profile"}
            </BusyButton>
            <Link to={`/${side}/dashboard`} className="text-button">
              Cancel
            </Link>
          </div>
        </form>
        {current && (
          <section className="agent-actions">
            <h2>Run on saved version {current.version}</h2>
            <div className="inline">
              {["analyze", "audit"].map((action) => (
                <BusyButton
                  key={action}
                  className="button white"
                  onClick={() =>
                    void act(async () => {
                      setAgentResult(
                        await api(
                          `/${side === "founder" ? "companies" : "funders"}/${current.id}/${action}`,
                          "POST",
                        ),
                      );
                    })
                  }
                >
                  {action === "audit" ? (
                    <ShieldCheck size={17} />
                  ) : (
                    <Activity size={17} />
                  )}{" "}
                  {action === "audit" ? "Audit evidence" : "Analyze profile"}
                </BusyButton>
              ))}
              <BusyButton
                onClick={() =>
                  void act(async () => {
                    await api(
                      `/${side === "founder" ? "companies" : "funders"}/${current.id}/matches`,
                      "POST",
                    );
                    await refresh();
                    navigate(`/${side}/matches`);
                  })
                }
              >
                <Workflow size={17} /> Match saved profile
              </BusyButton>
            </div>
            {agentResult && (
              <div className="agent-result">
                <pre>{JSON.stringify(agentResult.result, null, 2)}</pre>
                <Link to={`/agent-trace/${agentResult.runId}`}>
                  View agent trace <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="clean-list">
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}
function MatchDetail() {
  const { id } = useParams();
  const { act, refresh } = useApp();
  const [data, setData] = useState<{
      match: Match;
      stale: boolean;
      requests: Handoff[];
    } | null>(null),
    [note, setNote] = useState(""),
    [kind, setKind] = useState("request-introduction");
  async function load() {
    setData(await api(`/matches/${id}`));
  }
  useEffect(() => {
    void act(load);
  }, [id]);
  if (!data) return <Empty title="Loading match" />;
  const m = data.match;
  return (
    <main className="workspace match-detail">
      <Link className="back-link" to="/founder/matches">
        <ArrowLeft size={16} /> All matches
      </Link>
      <PageHead
        eyebrow="BILATERAL FIT / MATCH REVIEW"
        title={`${m.companyName} × ${m.funderName}`}
        action={
          <>
            <DownloadButton data={data} name={`match-${m.id}`} />
            <Link className="button white" to={`/agent-trace/${m.runId}`}>
              <Activity size={17} /> Agent trace
            </Link>
          </>
        }
      >
        <p className="muted">
          {date(m.createdAt)} · Company v{m.companyVersion} / Mandate v
          {m.funderVersion} · {m.engineVersion}
        </p>
      </PageHead>
      {data.stale && (
        <div className="notice warning">
          <AlertTriangle size={18} /> This match is stale. Profiles changed or
          the day rolled over. Rerun before a handoff.{" "}
          <Link to="/founder/dashboard">Return to workspace</Link>
        </div>
      )}
      <div className="verdict">
        <div className="score-large">
          <strong>{m.score}</strong>
          <span>
            / 100
            <br />
            weighted fit
          </span>
        </div>
        <div>
          <Badge value={m.decision} />
          <h2>
            {m.decision === "INTRODUCTION_READY"
              ? "A conversation worth reviewing."
              : m.decision === "REJECTED"
                ? "A mandate mismatch."
                : m.decision === "LOW_FIT"
                  ? "Limited alignment."
                  : "More evidence comes first."}
          </h2>
          <p>{m.nextAction}</p>
          <small>
            Fit score is not funding probability. A high score never overrides a
            hard failure.
          </small>
        </div>
      </div>
      <div className="detail-grid">
        <section>
          <div className="section-heading">
            <h2>Fit decomposition</h2>
            <span className="muted">Weighted / 100</span>
          </div>
          {m.dimensions.map((d) => (
            <div className="dimension" key={d.name}>
              <div>
                <h3>{d.name}</h3>
                <strong>
                  {d.points} <span>/ {d.weight}</span>
                </strong>
              </div>
              <progress
                max={d.weight}
                value={d.points}
                aria-label={`${d.name} score`}
              />
              <p>{d.reason}</p>
              <small>
                {d.evidenceRefs.length
                  ? d.evidenceRefs.join(" · ")
                  : "Profile claim / no supporting shared evidence reference"}
              </small>
            </div>
          ))}
        </section>
        <aside>
          <section>
            <h2>
              <ShieldCheck size={20} /> Decision gates
            </h2>
            <h3>Hard constraints</h3>
            {m.hardFailures.length ? (
              <BulletList items={m.hardFailures} />
            ) : (
              <p className="pass">
                <Check size={17} /> All known hard constraints passed.
              </p>
            )}
            <h3>Evidence gaps</h3>
            {m.gaps.length ? (
              <BulletList items={m.gaps} />
            ) : (
              <p className="pass">
                <Check size={17} /> Required shared evidence is current.
              </p>
            )}
            <h3>Limits & warnings</h3>
            <BulletList items={m.warnings} />
          </section>
          <section>
            <h2>Two independent perspectives</h2>
            <h3>Company Match Agent</h3>
            <p>{m.companyPerspective}</p>
            <h3>Funding Match Agent</h3>
            <p>{m.funderPerspective}</p>
          </section>
        </aside>
      </div>
      <section className="evidence-section">
        <div className="section-heading">
          <h2>Shared evidence snapshot</h2>
          <span className="muted">As of this run</span>
        </div>
        <div className="evidence-table">
          {m.evidenceSnapshot.map((e) => (
            <div key={e.id}>
              <FileText size={18} />
              <div>
                <h3>{e.label}</h3>
                <p>{e.source}</p>
                <small>
                  {e.id} · {e.observedAt} · {label(e.visibility)}
                </small>
              </div>
              <Badge value={e.provenance} />
            </div>
          ))}
        </div>
      </section>
      <section className="analysis-pair">
        {[
          ["Company analysis", m.companyAnalysis],
          ["Funding analysis", m.funderAnalysis],
        ].map(([title, a]) => {
          const analysis = a as Match["companyAnalysis"];
          return (
            <div key={title as string}>
              <h2>{title as string}</h2>
              <p>{analysis.summary}</p>
              <h3>Strengths</h3>
              <BulletList items={analysis.strengths} />
              <h3>Human diligence still needed</h3>
              <BulletList items={analysis.risks} />
            </div>
          );
        })}
      </section>
      <section className="human-gate">
        <div>
          <p className="eyebrow">HUMAN HANDOFF</p>
          <h2>The next move is yours.</h2>
          <p>
            Requests stay in this workspace. No email, introduction or documents
            are sent. A response cannot override an audit: update the profile
            and rerun.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act(async () => {
              await api(`/matches/${m.id}/${kind}`, "POST", { note });
              setNote("");
              await load();
              await refresh();
            });
          }}
        >
          <Field label="Next action">
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="request-introduction">
                Record introduction request
              </option>
              <option value="request-info">Request more information</option>
              <option value="respond-info">Record information response</option>
            </select>
          </Field>
          <Field label="Human review note">
            <textarea
              required
              minLength={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What should the next conversation establish?"
            />
          </Field>
          <BusyButton
            disabled={
              data.stale ||
              (kind === "request-introduction" &&
                m.decision !== "INTRODUCTION_READY") ||
              (kind === "respond-info" &&
                !data.requests.some((r) => r.kind === "information"))
            }
          >
            <Send size={17} /> Record action
          </BusyButton>
        </form>
      </section>
      {data.requests.length > 0 && (
        <section>
          <h2>Recorded actions</h2>
          <div className="handoff-list">
            {data.requests.map((r) => (
              <div key={r.id}>
                <Badge value={r.kind} />
                <p>{r.note}</p>
                <small>{date(r.createdAt)} · Recorded, not sent</small>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
function Trace() {
  const { id } = useParams(),
    { act } = useApp();
  const [run, setRun] = useState<Run | null>(null);
  useEffect(() => {
    void act(async () => setRun(await api(`/agent-runs/${id}`)));
  }, [id]);
  if (!run) return <Empty title="Loading agent trace" />;
  return (
    <main className="workspace">
      <Link className="back-link" to="/founder/matches">
        <ArrowLeft size={17} /> Matches
      </Link>
      <PageHead
        eyebrow="A2A PROTOCOL V1.0"
        title="Nothing behind the curtain."
        action={<DownloadButton data={run} name={`trace-${run.id}`} />}
      >
        <p className="muted">
          {run.events.length} events · {run.execution} execution ·{" "}
          {run.engineVersion}
          <br />
          {date(run.createdAt)} · Run {run.id}
        </p>
      </PageHead>
      <div className="trace-legend">
        <span>
          <span className="live-dot" /> Company side
        </span>
        <span className="blue">
          <span className="live-dot" /> Funding side
        </span>
        <span>Shared protocol / human gate</span>
      </div>
      <div className="timeline">
        {run.events.map((e) => (
          <article
            className={
              e.from.startsWith("funding")
                ? "funding-event"
                : e.from.startsWith("company")
                  ? "company-event"
                  : "shared-event"
            }
            key={e.id}
          >
            <div className="event-number">
              {e.sequence.toString().padStart(2, "0")}
            </div>
            <div className="event-body">
              <div className="event-header">
                <Badge value={e.type} />
                <time>{new Date(e.timestamp).toLocaleTimeString()}</time>
              </div>
              <h2>{e.summary}</h2>
              <p className="event-route">
                {e.from} <ArrowRight size={14} /> {e.to}
              </p>
              {e.evidenceRefs.length > 0 && (
                <small>Evidence: {e.evidenceRefs.join(" · ")}</small>
              )}
              <details>
                <summary>
                  Structured payload <ChevronDown size={14} />
                </summary>
                <pre>{JSON.stringify(e.payload, null, 2)}</pre>
              </details>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
function About() {
  return (
    <main className="workspace about">
      <PageHead
        eyebrow="OPEN PROTOCOL / OPEN SOURCE"
        title="Let the agents meet first."
      >
        <p className="lead">
          Deep Funding is evidence-aware, bilateral funding screening
          infrastructure. It is not an investor list or an autonomous dealmaker.
        </p>
      </PageHead>
      <section>
        <h2>Eight scoped agents. Two accountable sides.</h2>
        <div className="analysis-pair">
          {[
            [
              "Company Agent",
              "Profile normalization",
              "Stage, needs and readiness",
              "Evidence gaps and consistency",
              "Accepted capital and resource fit",
            ],
            [
              "Funding Agent",
              "Mandate normalization",
              "Investment scope and constraints",
              "Mandate currency and completeness",
              "Independent company screening",
            ],
          ].map(([t, ...steps]) => (
            <div key={t}>
              <h3>{t}</h3>
              {steps.map((s, i) => (
                <p key={s}>
                  <b>
                    0{i + 1} /{" "}
                    {["Information", "Analysis", "Audit", "Match"][i]}
                  </b>
                  <br />
                  {s}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>Protocol, not an unbounded chat.</h2>
        <p className="protocol-text">
          PROFILE_READY → ANALYSIS_READY → AUDIT_READY → MATCH_REQUEST →
          MATCH_RESPONSE → GAP_REQUEST / GAP_RESPONSE → MATCH_DECISION →
          HUMAN_HANDOFF
        </p>
        <p>
          Optional gap events occur only when there is a gap or a human
          request/response. Trace events contain structured facts and decision
          summaries, not hidden model reasoning. These are application-level
          messages; compatibility with an external A2A standard is not claimed.
        </p>
      </section>
      <section>
        <h2>What determines a match?</h2>
        <p>
          Stage, region, ticket range, excluded sector, product, revenue and
          team requirements are hard filters. Company capital preferences must
          also accept the provider. A failure vetoes the match regardless of
          score. Unknown facts and absent, old or restricted evidence require
          more information.
        </p>
        <p>
          The seed-VC baseline weights stage 25, sector 20, ticket 15, geography
          10, traction 10, team 10 and strategic coverage 10. Review-ready
          requires at least 75/100, no failures and no gaps. This is a
          configurable engineering policy, not a prediction, financial
          recommendation or industry standard.
        </p>
        <p>
          The requested amount is treated as a single-provider ticket, not a
          full funding round with multiple investors. USD only. Valuation,
          instrument economics, legal eligibility and capital availability
          remain outside the matching model.
        </p>
      </section>
      <section id="privacy">
        <h2>Private by workspace. Human by design.</h2>
        <p>
          Each browser receives an opaque, HTTP-only session cookie. D1 stores
          the workspace for seven days; expired sessions cannot access it and
          daily cleanup deletes expired rows. Export or delete your workspace at
          any time. Losing the cookie loses access; this MVP does not provide
          identity recovery or cross-device accounts.
        </p>
        <p>
          Use fictional data. No bank details, identity documents, confidential
          contracts or real deal-room materials. PUBLIC means eligible to share
          inside this sandbox, not an internet publication. PRIVATE and
          NDA_REQUIRED evidence is excluded from A2A matching, as are private
          notes. Withdrawing consent prevents new matching; earlier snapshots
          remain in your private history until deletion.
        </p>
        <p>
          Creating an introduction records a human request only. There is no
          mail transport, investor outreach, automatic negotiation, document
          upload or money movement. No LLM API is called. All agents currently
          execute bounded, deterministic rules; embeddings and optional model
          explanations are future adapters, not hidden functionality.
        </p>
      </section>
      <section>
        <h2>Built in public.</h2>
        <p>
          React + TypeScript · Cloudflare Workers + D1 · Versioned contracts ·
          Reproducible matching tests
        </p>
        <a
          className="button"
          href="https://github.com/pengpengyi92/deep-funding"
        >
          Explore the repository <ArrowUpRight size={17} />
        </a>
      </section>
    </main>
  );
}
function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { error, busy, ws, init, refresh } = useApp();
  useEffect(() => {
    if (location.pathname === "/funding/explorer" && !ws)
      void refresh().catch(() => undefined);
  }, [location.pathname, ws]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <Header />
      {busy && (
        <div className="working-bar" role="status">
          Processing <LoaderCircle className="spin" size={14} />
        </div>
      )}
      {error && (
        <div className="global-error" role="alert">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}
      <div id="content">
        <Routes>
          <Route
            path="/"
            element={
              document.querySelector('meta[name="deep-funding-runtime"]') ? (
                <Navigate to="/data-explorer" replace />
              ) : (
                <Landing />
              )
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/rsi" element={<RsiWorkspace />} />
          <Route
            path="/knowledge/funding"
            element={<KnowledgeWorkspace kind="funding" />}
          />
          <Route
            path="/knowledge/compliance"
            element={<KnowledgeWorkspace kind="compliance" />}
          />
          <Route path="/data-explorer" element={<DatabaseWorkspace />} />
          <Route path="/admin/database" element={<DatabaseWorkspace />} />
          <Route
            path="/funding/explorer"
            element={
              <FundingExplorer
                companies={ws?.companies || []}
                onImport={async (slug) => {
                  await init();
                  const p = await api<Profile<Funder>>(
                    `/funding-catalogue/${slug}/import`,
                    "POST",
                  );
                  await refresh();
                  navigate(`/funding/profile?edit=${p.id}`);
                }}
              />
            }
          />
          {(["founder", "funding"] as const).flatMap((side) => [
            <Route
              key={`${side}-d`}
              path={`/${side}/dashboard`}
              element={
                <WorkspaceGuard>
                  <Dashboard side={side} />
                </WorkspaceGuard>
              }
            />,
            <Route
              key={`${side}-p`}
              path={`/${side}/profile`}
              element={
                <WorkspaceGuard>
                  <Profiles side={side} />
                </WorkspaceGuard>
              }
            />,
            <Route
              key={`${side}-o`}
              path={`/${side}/onboarding`}
              element={
                <WorkspaceGuard>
                  <Profiles side={side} onboarding />
                </WorkspaceGuard>
              }
            />,
            <Route
              key={`${side}-m`}
              path={`/${side}/matches`}
              element={
                <WorkspaceGuard>
                  <Matches side={side} />
                </WorkspaceGuard>
              }
            />,
          ])}
          <Route
            path="/match/:id"
            element={
              <WorkspaceGuard>
                <MatchDetail />
              </WorkspaceGuard>
            }
          />
          <Route
            path="/agent-trace/:id"
            element={
              <WorkspaceGuard>
                <Trace />
              </WorkspaceGuard>
            }
          />
          <Route
            path="*"
            element={
              <Empty title="Page not found">
                <Link to="/">Return home</Link>
              </Empty>
            }
          />
        </Routes>
      </div>
      <Footer />
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>,
);
