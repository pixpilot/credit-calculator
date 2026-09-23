# @pixpilot/credit-package-margin-calculator-ui

The screen for `@pixpilot/credit-package-margin-calculator`: a live, editable model of what a month of credit usage costs and what each pack we sell earns on it.

```tsx
import { CreditPackageMarginCalculator } from '@pixpilot/credit-package-margin-calculator-ui';
import { ADMIN_CREDIT_FEATURE_SCENARIOS } from '@/lib/feature-cost-scenarios';

<CreditPackageMarginCalculator defaultValue={ADMIN_CREDIT_FEATURE_SCENARIOS} />;
```

The cost scenarios an application already keeps for its other calculators seed the table as they are — a scenario names an operation and estimates what one run of it burns, which is exactly what a feature row needs.

With no `defaultValue`, it opens on the shipped defaults: one active job seeker's month, and the `$5 → 500`, `$10 → 1,000`, `$15 → 1,500` packs.

## What it shows

- **Assumptions** — input and output $ per 1M tokens, a 50–95% target margin, and a switch for the payment processor's 2.9% + $0.30 per sale.
- **Summary** — the month's cost, the credits it issues, and the blended and worst-case cost of one credit, with the feature the worst case belongs to named under it.
- **Feature costs** — every field editable inline; cost per run, cost per credit, total cost and total credits computed. The row driving the worst case is marked in red and labelled `worst`, because it is the one every package below is stress-tested against.
- **Credit packages** — price and credits editable; processor fee, net revenue, both margins, and the credits each price could carry at the target margin under each cost.

Rows can be added and removed in both tables. Nothing is fetched, and nothing is persisted: the whole screen is in-memory state, recomputed on the keystroke.

## Controlled or self-contained

The three editable values are held apart, so sweeping the target margin never disturbs a token estimate, and a host can control any one of them without owning the other two:

| Uncontrolled      | Controlled | Change             |
| ----------------- | ---------- | ------------------ |
| `defaultValue`    | `value`    | `onChange`         |
| `defaultPackages` | `packages` | `onPackagesChange` |
| `defaultSettings` | `settings` | `onSettingsChange` |

`defaultValue` takes scenarios; `value` and `onChange` take the `FeatureRow`s the table actually edits, since a controlled host owns the ids.

## Editing figures a calculation will reject

The calculation rejects a negative token count or a fractional run rather than pricing it, and a field that refuses every intermediate state cannot be typed into: clearing `100` to type `20` passes through the empty string.

So every numeric cell keeps its raw text while it is being edited and commits only a value the calculator accepts (`useNumericDraft`). Leaving the field drops the draft, so a half-typed entry is replaced by the figure actually in force rather than left on screen looking as though it counted.

## Look

Dark, data-dense, and deliberately not a card layout: hairline borders, no radius to speak of, no shadows, monospaced tabular figures for every number and sans-serif for every label. The panel carries its own `dark` surface, so it reads the same whatever theme the page around it is set to.

Both tables scroll horizontally inside their own panel on a narrow viewport, so the summary and the other table stay in place.

Colour is never the only signal: each margin carries its status in words — `on target`, `under target`, `below target`, `not priced` — under the figure, and the worst-case row is labelled as well as tinted.
