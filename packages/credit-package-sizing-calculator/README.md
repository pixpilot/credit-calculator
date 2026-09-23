# @pixpilot/credit-package-sizing-calculator

Pure, validated modelling of a **credit package**: what a mix of features costs, how many credits a price can safely include, and what that leaves as margin.

It sits beside the other calculators rather than replacing them. They answer a narrower question each; this one answers the commercial one:

| Package                                      | Answers                                                           |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `@pixpilot/cost-calculator`                  | what one operation costs us to run                                |
| `@pixpilot/credit-allocation-calculator`     | how that cost spreads across the credits an administrator assigns |
| `@pixpilot/credit-pricing-calculator`        | what one credit must sell for to reach a target gross margin      |
| `@pixpilot/credit-package-sizing-calculator` | how many credits a package price may include, and what it earns   |
| `@pixpilot/credit-package-margin-calculator` | what margin the packages already on sale earn                     |
| `@pixpilot/credit-usage-calculator`          | what a customer's credit balance buys them                        |

## Four things this result never collapses into one number

- **Expected margin** — at the usage distribution the feature table describes.
- **Worst-case margin** — if every credit is spent on the least efficient feature.
- **Target margin** — the minimum the business wants to hold.
- **Safety buffer** — protection against the estimate itself being wrong: model repricing, retries, low token estimates, infrastructure variance, abnormal usage.

A package that fails is failing for one of those reasons, and the fix is different for each. The buffer raises the assumed cost of goods sold; it never pads revenue.

## Usage

```ts
import { calculatePricingSummary } from '@pixpilot/credit-package-sizing-calculator';

const summary = calculatePricingSummary(
  [
    {
      name: 'AI Job Insights',
      creditsPerExecution: 5,
      quantity: 100,
      inputTokens: 15_000,
      outputTokens: 1_000,
      fixedCostPerExecution: 0.000002,
      fixedCostName: 'Worker execution',
    },
  ],
  {
    inputCostPerMillionTokens: 0.2,
    outputCostPerMillionTokens: 1.2,
    packagePrice: 5,
    currentPackageCredits: 500,
    targetGrossMarginPercent: 80,
    safetyBufferPercent: 20,
    subscriptionCreditBonusPercent: 40,
    freeCreditsPerWeek: 25,
  },
);

summary.mix.weightedAverageCostPerCredit; // { amount: '0.00084…', currency: 'USD' }
summary.currentPackage.expectedGrossMarginPercent; // 91.6
summary.limits.worstCaseSafeCredits; // credits the target margin actually supports
summary.suggestedPackage.credits; // rounded down to a package increment
summary.subscription.credits; // the same price, with the bonus applied
```

Only the eight figures above are required. Everything else — the package increment (25), the credits a standard action charges (5), how far below the safe maximum a suggestion stops (10%), the comparison sizes, the point at which a margin counts as healthy — has a default and can be overridden.

## Feature input

Every field but `name` is optional, so a scenario list an application already keeps for its cost calculators can be priced as it stands. Missing figures default to one execution, one credit, no tokens and no fixed cost.

Rows are keyed by a stable `id`. `createCreditPricingFeatures` derives one from the name when a caller supplies none, keeps an id it is given, and disambiguates duplicates — so an editable table can add, remove, and rename rows without a row losing its identity.

## Money

Amounts are `Money` from `@pixpilot/cost-calculator`: exact decimal strings, carried in `bigint` at 30 decimal places. Nothing is rounded until it is displayed, because the interesting digits of this calculator — a cost per credit of `$0.0008404` — are exactly the ones a float loses.

Figures that cannot be calculated are `null`, never `0`, `NaN`, or `Infinity`. A package whose cost is unknown is not a package that costs nothing.
