# @pixpilot/credit-package-margin-calculator

Pure, validated calculation of what a month of usage costs and what that leaves on each credit package we sell.

It is the only calculator that reads the packages **already on sale**, each a price and the credits it hands over, rather than sizing one from scratch:

| Package                                      | Answers                                                           |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `@pixpilot/cost-calculator`                  | what one operation costs us to run                                |
| `@pixpilot/credit-allocation-calculator`     | how that cost spreads across the credits an administrator assigns |
| `@pixpilot/credit-pricing-calculator`        | what one credit must sell for to reach a target gross margin      |
| `@pixpilot/credit-package-sizing-calculator` | how many credits a package price may include, and what it earns   |
| `@pixpilot/credit-package-margin-calculator` | what margin the packages already on sale earn                     |
| `@pixpilot/credit-usage-calculator`          | what a customer's credit balance buys them                        |

```ts
import {
  calculateCreditPackagePricing,
  DEFAULT_CREDIT_PACKAGE_PRICING_SETTINGS,
  DEFAULT_FEATURE_ROWS,
  DEFAULT_PACKAGE_ROWS,
} from '@pixpilot/credit-package-margin-calculator';

const result = calculateCreditPackagePricing({
  features: [...DEFAULT_FEATURE_ROWS],
  packages: [...DEFAULT_PACKAGE_ROWS],
  settings: DEFAULT_CREDIT_PACKAGE_PRICING_SETTINGS,
});

result.totalCost; // 0.641426 — one active user's month
result.totalCredits; // 1000
result.blendedCostPerCredit; // 0.000641426
result.worstCostPerCredit; // 0.0012004
result.worstFeature?.name; // 'AI Resume Parsing'
result.packages[0]?.blendedMargin; // 93.5857…
result.packages[0]?.worstMargin; // 87.996
result.packages[0]?.suggestedCreditsWorst; // 833
```

## Two costs per credit, never one

- **`blendedCostPerCredit`** — `totalCost / totalCredits`. What the supplied usage mix actually costs. It is the whole month divided by the whole month's credits, never the average of the per-feature rates: averaging those weights a feature that runs once as heavily as one that runs a hundred times.
- **`worstCostPerCredit`** — the highest cost per credit any single feature carries. What a user who spends every credit on the dearest feature costs.

A package is only genuinely safe when it clears the target margin on the **second**. Both are reported for every package, and the calculator never collapses them into one number.

## The calculation

```text
variableCost = fixedCost
             + (inputTokens  / 1_000_000) × inputPricePerMillionTokens
             + (outputTokens / 1_000_000) × outputPricePerMillionTokens

totalCost     = variableCost × quantity
totalCredits  = creditCost × quantity
costPerCredit = variableCost / creditCost

blendedCostPerCredit = Σ totalCost / Σ totalCredits
worstCostPerCredit   = max(costPerCredit of every feature that charges credits)

stripeFee   = stripeFeesEnabled ? price × 2.9% + $0.30 : 0
netRevenue  = price - stripeFee

blendedMargin = ((netRevenue - credits × blendedCostPerCredit) / price) × 100
worstMargin   = ((netRevenue - credits × worstCostPerCredit)   / price) × 100

suggestedCredits = floor(netRevenue × (1 - targetMargin / 100) / costPerCredit)
```

The processor fee comes out of revenue **before** the margin math, so the margin is measured on what actually reaches us. `suggestedCredits` is floored — the credit above the ceiling is the one that breaks the target — and never negative: a price whose fee already exceeds it can afford no credits, which is worth saying plainly.

`quantity` is what one active job seeker runs in a month, so the totals read as a monthly spend per user rather than the price of a single call.

## Nothing is ever `NaN` or `Infinity`

A rate with no denominator is `null`, not a number that is not one:

- a feature with `creditCost: 0` has no `costPerCredit`, and takes no part in choosing the worst case;
- a month that issues no credits has no `blendedCostPerCredit` and no `worstCostPerCredit`, so every margin and suggestion is `null`;
- a package priced at `0` has no margin to measure.

## Margin status

`toMarginStatus(margin, targetMargin)` names where a margin stands, so a screen can say it as well as colour it:

| Status         | Condition                         |
| -------------- | --------------------------------- |
| `on-target`    | `margin ≥ target`                 |
| `near-target`  | within 10 percentage points under |
| `below-target` | further below than that           |
| `unknown`      | there is no margin to measure     |

## Seeding from scenarios you already keep

`createFeatureRows(scenarios)` turns the cost scenarios an application already maintains into editable rows, filling in only what a scenario leaves out — a run costs no tokens it does not name, and happens once unless it says otherwise:

```ts
import { ADMIN_CREDIT_FEATURE_SCENARIOS } from '@/lib/feature-cost-scenarios';

createFeatureRows(ADMIN_CREDIT_FEATURE_SCENARIOS);
```

The scenario shape is written out structurally rather than imported, so this package does not depend on the evaluator packages: anything that names an operation and estimates what one run of it burns can seed the table, and `ModelCostScenario` happens to be one such thing.

Ids are derived from names so a row keeps its identity across a re-seed, with a `-2` suffix where two features share a name.

## Precision

Unlike the cost, allocation and pricing calculators, amounts here are plain `number`s rather than exact `Money`. This calculator is a what-if for an administrator sweeping a slider, not a ledger: nothing it produces is charged, stored, or reconciled, and every figure is recomputed from the inputs on each keystroke rather than accumulated. Round only for display.

## Validation

Every input is parsed by `creditPackagePricingInputSchema` before anything is priced, and invalid input throws rather than producing a plausible-looking figure. Rejected: negative tokens, quantities, fixed costs, prices or credits; non-integer token, quantity or credit counts; a target margin of 100%, which no price can reach; and two rows sharing an id.

A caller editing these values live should therefore commit only values the calculator accepts — as `@pixpilot/credit-package-margin-calculator-ui` does — rather than letting a half-typed `-` tear down the screen it was typed into.
