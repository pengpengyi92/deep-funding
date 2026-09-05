import type { Company } from "../../../packages/schemas";
import {
  companyStages,
  categories,
} from "../../../packages/knowledge/taxonomy";
export function CompanyReadinessFields({
  value,
  onChange,
}: {
  value: Company;
  onChange: (patch: Partial<Company>) => void;
}) {
  const financials = value.financials || {
    annualRevenueUsd: null,
    operatingCashFlowUsd: null,
    debtUsd: null,
    annualDebtServiceUsd: null,
    repaymentSource: null,
    statementsAvailable: null,
  };
  return (
    <>
      <div className="form-grid">
        <label>
          Company stage
          <select
            value={
              value.companyStage === undefined
                ? "legacy"
                : value.companyStage || "unknown"
            }
            onChange={(e) =>
              onChange({
                companyStage:
                  e.target.value === "legacy"
                    ? undefined
                    : e.target.value === "unknown"
                      ? null
                      : (e.target.value as Company["companyStage"]),
              })
            }
          >
            <option value="legacy">Use legacy stage label</option>
            <option value="unknown">Unknown</option>
            {companyStages.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Last financing round
          <select
            value={value.financingRound || "unknown"}
            onChange={(e) =>
              onChange({
                financingRound:
                  e.target.value === "unknown"
                    ? null
                    : (e.target.value as Company["financingRound"]),
              })
            }
          >
            <option value="unknown">Unknown</option>
            {[
              "none",
              "pre_seed",
              "seed",
              "series_a",
              "series_b",
              "series_c_plus",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="consent">
        <input
          type="checkbox"
          checked={value.resourceOnly || false}
          onChange={(e) =>
            onChange({
              resourceOnly: e.target.checked,
              raiseUsd: e.target.checked ? 0 : value.raiseUsd,
            })
          }
        />{" "}
        Resources only; no cash request
      </label>
      <details>
        <summary>Provider category preferences</summary>
        <label className="consent">
          <input
            type="checkbox"
            checked={!!value.acceptedCategories}
            onChange={(e) =>
              onChange({
                acceptedCategories: e.target.checked
                  ? ["accelerator", "angel", "venture_capital"]
                  : undefined,
              })
            }
          />{" "}
          Use explicit capital + resource categories
        </label>
        {value.acceptedCategories && (
          <div className="catalogue-category-checks">
            {categories.map((c) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={value.acceptedCategories!.includes(c)}
                  onChange={(e) =>
                    onChange({
                      acceptedCategories: e.target.checked
                        ? [...value.acceptedCategories!, c]
                        : value.acceptedCategories!.filter((x) => x !== c),
                    })
                  }
                />{" "}
                {c.replaceAll("_", " ")}
              </label>
            ))}
          </div>
        )}
      </details>
      <details className="financial-fields">
        <summary>
          Financial disclosure for growth, PE and credit policies
        </summary>
        <div className="form-grid">
          {(
            [
              "annualRevenueUsd",
              "operatingCashFlowUsd",
              "debtUsd",
              "annualDebtServiceUsd",
            ] as const
          ).map((k) => (
            <label key={k}>
              {
                {
                  annualRevenueUsd: "Annual revenue, USD",
                  operatingCashFlowUsd: "Operating cash flow, USD / year",
                  debtUsd: "Total debt, USD",
                  annualDebtServiceUsd: "Annual debt service, USD",
                }[k]
              }
              <input
                type="number"
                step="any"
                min={k === "operatingCashFlowUsd" ? undefined : 0}
                placeholder="Unknown"
                value={financials[k] ?? ""}
                onChange={(e) =>
                  onChange({
                    financials: {
                      ...financials,
                      [k]:
                        e.target.value === "" ? null : Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          ))}
          <label>
            Repayment source
            <input
              maxLength={500}
              value={financials.repaymentSource || ""}
              placeholder="Unknown"
              onChange={(e) =>
                onChange({
                  financials: {
                    ...financials,
                    repaymentSource: e.target.value || null,
                  },
                })
              }
            />
          </label>
          <label>
            Financial statements available
            <select
              value={String(financials.statementsAvailable)}
              onChange={(e) =>
                onChange({
                  financials: {
                    ...financials,
                    statementsAvailable:
                      e.target.value === "null"
                        ? null
                        : e.target.value === "true",
                  },
                })
              }
            >
              <option value="null">Unknown</option>
              <option value="true">Yes, reported</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>
      </details>
    </>
  );
}
