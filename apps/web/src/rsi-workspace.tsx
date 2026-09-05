import { useState } from "react";
import { Download, Play, RotateCcw, LockKeyhole } from "lucide-react";
import {
  demoConfig,
  demoFounder,
  demoPortfolio,
  demoCandidate,
  demoProviders,
} from "../../../data/rsi-demo";
import { BenchmarkEngine } from "../../../packages/benchmark/engine";
import { founderRSI, parseData } from "../../../packages/services/rsi";
import {
  cohortModes,
  candidateSchema,
  type BenchmarkConfig,
} from "../../../packages/benchmark/schemas";

function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function RsiWorkspace() {
  const [side, setSide] = useState<"founder" | "funding">("founder");
  const [founder, setFounder] = useState(demoFounder),
    [providers, setProviders] = useState(demoProviders);
  const [portfolio, setPortfolio] = useState(demoPortfolio),
    [candidate, setCandidate] = useState(demoCandidate);
  const [config, setConfig] = useState(demoConfig),
    [error, setError] = useState("");
  const [isDemo, setIsDemo] = useState(true),
    [selected, setSelected] = useState(0);
  const [founderResult, setFounderResult] = useState<ReturnType<
    typeof founderRSI
  > | null>(null);
  const [fundingResult, setFundingResult] = useState<ReturnType<
    BenchmarkEngine["compare"]
  > | null>(null);
  const change = (patch: Partial<BenchmarkConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
    setFounderResult(null);
    setFundingResult(null);
  };
  async function importFile(file: File | undefined, kind?: "candidate") {
    if (!file) return;
    setError("");
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("File must be at most 5 MiB");
      const text = await file.text();
      if (kind === "candidate")
        setCandidate(candidateSchema.parse(JSON.parse(text)));
      else {
        const data = parseData(text);
        if (data.kind === "founder") setFounder(data.value);
        if (data.kind === "providers") setProviders(data.value);
        if (data.kind === "portfolio") setPortfolio(data.value);
        if (data.kind === "config") setConfig(data.value);
      }
      setIsDemo(false);
      setFounderResult(null);
      setFundingResult(null);
      setSelected(0);
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "Invalid JSON"
          : e instanceof Error
            ? e.message
            : "Invalid data",
      );
    }
  }
  function run() {
    setError("");
    try {
      if (side === "founder") {
        setFounderResult(founderRSI(founder, providers, config));
        setSelected(0);
      } else
        setFundingResult(
          BenchmarkEngine.fit(portfolio, config).compare(candidate),
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
    }
  }
  function reset() {
    setFounder(demoFounder);
    setProviders(demoProviders);
    setPortfolio(demoPortfolio);
    setCandidate(demoCandidate);
    setConfig(demoConfig);
    setIsDemo(true);
    setFounderResult(null);
    setFundingResult(null);
    setError("");
  }
  const detail = founderResult?.results[selected];
  return (
    <main className="rsi-workspace">
      <div className="rsi-heading">
        <div>
          <span className="eyebrow">RECURSIVE SELECTION INTELLIGENCE</span>
          <h1>Your data. Your benchmark.</h1>
          <p>Founder fit and private portfolio research.</p>
        </div>
        <span className="rsi-privacy">
          <LockKeyhole size={16} /> Browser memory only · No upload
        </span>
      </div>
      <div className="rsi-toolbar">
        <div role="tablist" aria-label="RSI direction">
          {(["founder", "funding"] as const).map((s) => (
            <button
              role="tab"
              aria-selected={side === s}
              key={s}
              onClick={() => setSide(s)}
            >
              {s === "founder" ? "Founder RSI" : "Funding RSI"}
            </button>
          ))}
        </div>
        <span>
          {isDemo ? "Synthetic demonstration" : "Local session inputs"}
        </span>
        <button
          title="Reset to synthetic examples"
          aria-label="Reset to synthetic examples"
          onClick={reset}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      <section className="rsi-imports" aria-label="Local data">
        <label>
          Founder / providers / portfolio / config
          <input
            aria-label="Import RSI dataset"
            type="file"
            accept=".json,.jsonl"
            onChange={(e) => {
              void importFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <label>
          Candidate features
          <input
            aria-label="Import candidate"
            type="file"
            accept=".json"
            onChange={(e) => {
              void importFile(e.target.files?.[0], "candidate");
              e.target.value = "";
            }}
          />
        </label>
        <span>
          {providers.length} providers · {portfolio.length} portfolio records
        </span>
      </section>
      <div className="rsi-layout">
        <section className="rsi-config" aria-label="Benchmark configuration">
          <h2>Benchmark configuration</h2>
          <label>
            As-of date
            <input
              type="date"
              value={config.asOf}
              onChange={(e) => change({ asOf: e.target.value })}
            />
          </label>
          <label>
            Cohort
            <select
              aria-label="Cohort"
              value={config.mode}
              onChange={(e) =>
                change({ mode: e.target.value as BenchmarkConfig["mode"] })
              }
            >
              {cohortModes.map((m) => (
                <option key={m} value={m}>
                  {m.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Provider ID
            <input
              value={config.providerId ?? ""}
              placeholder="All providers"
              onChange={(e) => change({ providerId: e.target.value || null })}
            />
          </label>
          {config.mode === "sector_specific" && (
            <label>
              Sector
              <input
                value={config.sector ?? ""}
                onChange={(e) => change({ sector: e.target.value || null })}
              />
            </label>
          )}
          {config.mode === "stage_specific" && (
            <label>
              Stage
              <input
                value={config.stage ?? ""}
                onChange={(e) => change({ stage: e.target.value || null })}
              />
            </label>
          )}
          {config.mode === "custom_cohort" && (
            <label>
              Record IDs
              <input
                value={config.ids.join(",")}
                onChange={(e) =>
                  change({
                    ids: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
          )}
          {config.mode === "time_window" && (
            <>
              <label>
                From
                <input
                  type="date"
                  value={config.from ?? ""}
                  onChange={(e) => change({ from: e.target.value || null })}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={config.to ?? ""}
                  onChange={(e) => change({ to: e.target.value || null })}
                />
              </label>
            </>
          )}
          {config.mode === "percentile" && (
            <label>
              Threshold percentile
              <input
                type="number"
                min="0"
                max="100"
                value={config.percentile}
                onChange={(e) => change({ percentile: Number(e.target.value) })}
              />
            </label>
          )}
          <label>
            Minimum comparable samples
            <input
              type="number"
              min="2"
              max="5000"
              value={config.minSamples}
              onChange={(e) => change({ minSamples: Number(e.target.value) })}
            />
          </label>
          <details>
            <summary>Feature weights</summary>
            {config.features.map((f, i) => (
              <label key={f.key}>
                {f.label}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={f.weight}
                  onChange={(e) =>
                    change({
                      features: config.features.map((x, j) =>
                        i === j ? { ...x, weight: Number(e.target.value) } : x,
                      ),
                    })
                  }
                />
              </label>
            ))}
          </details>
          <button onClick={run} className="primary">
            <Play size={16} />
            Run {side === "founder" ? "Founder" : "Funding"} RSI
          </button>
          <button onClick={() => download(config, "benchmark-config.json")}>
            <Download size={16} />
            Export config
          </button>
        </section>
        <section className="rsi-results" aria-live="polite">
          {error && (
            <p role="alert" className="rsi-error">
              {error}
            </p>
          )}
          <h2>{side === "founder" ? founder.company.name : candidate.name}</h2>
          <p>
            {side === "founder"
              ? founder.fundingHistory.length +
                " history events · " +
                founder.company.sector
              : candidate.sector +
                " · " +
                candidate.stage +
                " · snapshot " +
                candidate.snapshotDate}
          </p>
          {side === "funding" && (
            <details className="rsi-candidate">
              <summary>Candidate features</summary>
              {config.features.map((f) => (
                <label key={f.key}>
                  {f.label} ({f.unit})
                  <input
                    type="number"
                    aria-label={"Candidate " + f.label}
                    value={candidate.features[f.key] ?? ""}
                    placeholder="Unknown"
                    onChange={(e) => {
                      setCandidate((c) => ({
                        ...c,
                        features: {
                          ...c.features,
                          [f.key]:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        },
                      }));
                      setFundingResult(null);
                    }}
                  />
                </label>
              ))}
            </details>
          )}
          {side === "founder" && founderResult && (
            <>
              <div className="rsi-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Heuristic</th>
                      <th>Coverage</th>
                      <th>Gate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {founderResult.results.map((r, i) => (
                      <tr
                        key={r.providerId}
                        className={i === selected ? "selected" : ""}
                      >
                        <td>
                          <button onClick={() => setSelected(i)}>
                            {r.name}
                          </button>
                          {r.synthetic && <small>SYNTHETIC</small>}
                        </td>
                        <td>{r.score.toFixed(2)}</td>
                        <td>{Math.round(r.coverage * 100)}%</td>
                        <td>{r.recommendation.replaceAll("_", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detail && (
                <div className="rsi-explanation">
                  <h3>{detail.name}</h3>
                  <p>
                    Policy: {detail.policyId} · {detail.history.samples}{" "}
                    historical opportunities
                  </p>
                  {detail.components.map((c) => (
                    <div className="rsi-component" key={c.name}>
                      <span>{c.name.replaceAll("_", " ")}</span>
                      <meter min="0" max={c.weight} value={c.points} />
                      <span>
                        {c.points.toFixed(2)} / {c.weight}
                      </span>
                    </div>
                  ))}
                  <ul>
                    {[...detail.hardFailures, ...detail.gaps].map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                  <p>{detail.nextAction}</p>
                </div>
              )}
              <button
                onClick={() =>
                  download(founderResult, "founder-rsi.private.json")
                }
              >
                <Download size={16} />
                Export private result
              </button>
              {founderResult.warnings.map((w) => (
                <p className="rsi-warning" key={w}>
                  {w}
                </p>
              ))}
            </>
          )}
          {side === "funding" && fundingResult && (
            <>
              <div className="rsi-metrics">
                <div>
                  <small>Heuristic score</small>
                  <strong>
                    {fundingResult.score?.toFixed(2) ?? "Unknown"}
                  </strong>
                </div>
                <div>
                  <small>Cohort threshold</small>
                  <strong>
                    {fundingResult.threshold?.toFixed(2) ?? "Insufficient data"}
                  </strong>
                </div>
                <div>
                  <small>Empirical percentile</small>
                  <strong>
                    {fundingResult.percentile?.toFixed(1) ?? "Unknown"}
                  </strong>
                </div>
                <div>
                  <small>Comparable samples</small>
                  <strong>{fundingResult.comparableSamples}</strong>
                </div>
              </div>
              <p>
                {fundingResult.status} · coverage{" "}
                {Math.round(fundingResult.coverage * 100)}% ·{" "}
                {fundingResult.benchmarkVersion}
              </p>
              <div className="rsi-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Observed</th>
                      <th>Weight</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundingResult.components.map((c) => (
                      <tr key={c.key}>
                        <td>
                          {c.label}
                          <small>{c.unit}</small>
                        </td>
                        <td>{c.value ?? "Unknown"}</td>
                        <td>{c.weight}</td>
                        <td>{c.points.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Strong dimensions:{" "}
                {fundingResult.strengths.join(", ") || "None above threshold"}
              </p>
              <p>
                Weak / missing:{" "}
                {[...fundingResult.weaknesses, ...fundingResult.missing].join(
                  ", ",
                ) || "None"}
              </p>
              <button
                onClick={() =>
                  download(fundingResult, "funding-rsi.private.json")
                }
              >
                <Download size={16} />
                Export private result
              </button>
              {fundingResult.warnings.map((w) => (
                <p className="rsi-warning" key={w}>
                  {w}
                </p>
              ))}
            </>
          )}
          {(side === "founder" ? !founderResult : !fundingResult) && (
            <p className="rsi-empty">No current evaluation.</p>
          )}
        </section>
      </div>
    </main>
  );
}
