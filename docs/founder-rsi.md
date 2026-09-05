# Founder RSI

Load a founder profile plus provider records. A founder carries the existing typed company, optional background/startup/domain/education notes, an optional benchmark feature snapshot and funding interaction history. Private examples must not be copied into the public `examples/` tree.

```bash
deepfunding founder import examples/founder_rsi/founder.json
deepfunding data import examples/founder_rsi/providers.json
deepfunding funding search --location shenzhen
deepfunding rsi founder run
deepfunding rsi founder rank --json
deepfunding rsi founder explain demo-frontier --json
```

The three providers above are synthetic. Without an imported dataset, search uses the public taxonomy catalogue and **does not invent Shenzhen locations**. Empty real Shenzhen search results are expected until verified records are added.

Baseline components: mandate fit 85 points, historical interaction signal 10, comparable portfolio similarity 5. Unknown history/similarity contributes zero and reduces coverage. Latest event per opportunity at the cutoff prevents counting contacted/replied/meeting on the same opportunity as independent successes. Stage progression uses a declared smoothed descriptive signal, not a probability. The baseline ranking can still favor providers previously contacted; preserve exploration and review this bias.

Mandatory consent, current shareable evidence, eligibility gaps and hard failures reuse the existing A2A matching engine. Good history cannot turn an incompatible debt provider into an eligible fit. `HUMAN_REVIEW` only means the configured internal gates were met; no messages, applications or investment decisions are sent. Rankings across policies are not statistically calibrated.

The GUI `/rsi` executes the same service entirely in browser memory. Export is an explicit user action; reloading discards imported inputs. Use CLI for durable private history and external-file backups. Fixed demo cutoff is 2026-09-05; set your own asOf through configuration for actual research.
