# @pixpilot/credit-allocation-calculator

Pure, validated simulation of what each configurable operation costs to run, how many credits it consumes, and what those credits are worth to the business.

What a credit **costs** and what a credit **sells for** are never the same calculation here. Allocation answers the first; customer pricing is a separate layer downstream of it.

Four things are kept apart:

| Concept                  | Where it comes from                                                           |
| ------------------------ | ----------------------------------------------------------------------------- |
| Provider execution cost  | `@pixpilot/cost-calculator`, from tokens/models/fixed infrastructure costs    |
| Runs                     | the number of times the operation will execute                                |
| Credits per execution    | a business decision the administrator controls                                |
| Credit pricing/economics | a subscription plan or credit pack, which says what a credit is worth in cash |

Credits do not create provider cost. They are an allocation laid on top of a cost that is already fixed by paths, model pricing, and runs; assigning more of them makes an operation more expensive **to the customer** and changes nothing about what it costs to serve.

```text
cost paths + model pricing
  -> calculateCreditAllocation       (provider cost, runs, credits, provider cost per credit)
  -> calculateCreditPricingEconomics (revenue, gross profit, gross margin, per scenario)
```

## Why `providerCostPerCredit` is never `creditPrice`

The rate this package reports is **`providerCostPerCredit`**, on per-operation results, on the overall result, and in the UI. It always means:

```text
provider execution cost / credits consumed
```

It is an internal accounting metric — what one allocated credit costs the business to honour — and never the selling price of a credit. For the selling price, see [`@pixpilot/credit-pricing-calculator`](../credit-pricing-calculator).

## Allocating credits

```ts
import { calculateCreditAllocation } from '@pixpilot/credit-allocation-calculator';

const model = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

const allocation = calculateCreditAllocation(
  [
    {
      id: 'insights',
      label: 'Job Insights',
      runs: 35,
      creditsPerExecution: 5,
      paths: [
        {
          type: 'tokens',
          name: 'AI analysis',
          inputTokens: 15_000,
          outputTokens: 1_000,
        },
        { type: 'fixed', name: 'Worker execution', costPerExecution: 0.000002 },
      ],
    },
    // …any number of further operations
  ],
  model,
);

allocation.totalCredits; // 175
allocation.totalCost; // { amount: '0.09982', currency: 'USD' }
allocation.providerCostPerCredit; // { amount: '0.0005704', currency: 'USD' }
```

Nothing product-specific lives in the package: operations are supplied by the caller and can be added, removed, renamed, or repriced without touching it.

### Inputs

- `operations[].paths` — the operation's cost paths for **one** execution: token paths, fixed paths, or several of both.
- `operations[].runs` — the non-negative whole number of times that operation will execute.
- `operations[].creditsPerExecution` — a non-negative whole number; `0` models a deliberately free operation.

`createCreditAllocationOperations(costBatches)` builds a starting point from existing cost batches, using each batch's quantity as that operation's starting run count.

Pass one `ModelPricing` value as the second argument to `calculateCreditAllocation`; it prices every token path in the allocation.

### Results

Per operation: `runs`, `credits`, `cost`, `costPerExecution`, `providerCostPerCredit`, and the `costPaths` breakdown the cost calculator produced. Overall: `totalRuns`, `totalCredits`, `totalCost`, and `providerCostPerCredit`.

Each path in `costPaths` carries both figures too: `costPerExecution` prices one run, and `totalCost` prices every selected run — so an operation set to no runs still shows what one would cost while contributing nothing.

Everything is scaled from a single one-execution pricing pass with the exact `bigint` arithmetic in `@pixpilot/cost-calculator`, and returned as decimal USD strings. A path total, an operation total, and the grand total therefore cannot disagree: each is the one before it multiplied or added in atomic units, never re-derived from a rounded figure.

`creditsPerExecution` never moves any cost. It changes `credits`, `totalCredits`, and the derived provider-cost-per-credit rates only; what a workload costs to run is a function of its paths, its model, and its runs.

## Pricing those credits

`calculateCreditPricingEconomics` takes a finished `CreditAllocationResult` and reads it against one or more pricing scenarios. It recalculates no provider cost at all — every cost figure it reports is the one the allocation already produced.

```ts
import {
  calculateCreditAllocation,
  calculateCreditPricingEconomics,
} from '@pixpilot/credit-allocation-calculator';

const economics = calculateCreditPricingEconomics(allocation, [
  {
    id: 'starter',
    label: 'Starter plan',
    packagePrice: { amount: '20', currency: 'USD' },
    includedCredits: 10_000,
  },
  {
    id: 'promotional',
    label: 'Launch promotion',
    packagePrice: { amount: '20', currency: 'USD' },
    includedCredits: 10_000,
    bonusCredits: 2_000,
  },
]);

const [starter, promotional] = economics.scenarios;

starter.spendableCredits; // 10_000
starter.effectiveRevenuePerCredit; // { amount: '0.002', currency: 'USD' }
starter.operations[0].revenuePerExecution; // { amount: '0.01', currency: 'USD' }
starter.operations[0].grossMargin; // { value: '0.7148' }

promotional.spendableCredits; // 12_000 — the same $20 buys 2,000 more
promotional.operations[0].grossMargin; // { value: '0.65776…' }
```

### Scenarios

A scenario carries the source of truth, not a rate somebody derived by hand:

- `packagePrice` — what the customer pays, as an exact `Money` amount.
- `includedCredits` — the credits that price includes or sells. The name works for a subscription allowance and for a one-time pack alike.
- `bonusCredits` — optional promotional credits granted on top.

From those:

```text
spendableCredits          = includedCredits + bonusCredits
effectiveRevenuePerCredit = packagePrice / spendableCredits
```

There is deliberately no way to supply a `pricePerCredit` alongside a price and a credit count: two sources for one number are two numbers that drift apart.

Bonus credits are spendable, so they divide the same price across more credits. `$20 / 12,000` rather than `$20 / 10,000` is the conservative reading, and the right one — the customer can spend all 12,000.

### Per operation, per scenario

| Figure                      | Meaning                                           |
| --------------------------- | ------------------------------------------------- |
| `effectiveRevenuePerCredit` | `packagePrice / spendableCredits`                 |
| `revenuePerExecution`       | `creditsPerExecution × effectiveRevenuePerCredit` |
| `grossProfitPerExecution`   | `revenuePerExecution - providerCostPerExecution`  |
| `grossMargin`               | `grossProfitPerExecution / revenuePerExecution`   |
| `totalRevenue`              | `revenuePerExecution × runs`                      |
| `totalGrossProfit`          | `totalRevenue - totalProviderCost`                |

Each scenario also totals `totalRevenue`, `totalGrossProfit`, `totalProviderCost` and its own `grossMargin` across every operation.

Money stays in the exact `bigint` arithmetic of `@pixpilot/cost-calculator`; a margin is not money, so it is returned as a `Ratio` — the same exact decimal string treatment, where `{ value: '0.7148' }` reads as 71.48%.

### Scenarios differ, so margins differ

The same operation is not equally profitable on every plan. `effectiveRevenuePerCredit` depends on the scenario, so a discounted pack, an annual plan, and a promotion with bonus credits each produce their own margin for an identical execution. That is why scenarios are a list rather than one global `pricePerCredit`, and why the result keeps them side by side.

### Nothing, and no answer, are different things

Following the package's existing convention, a rate with no denominator is `null` rather than `0`, `NaN`, or `Infinity`:

| Case                                    | Result                                                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Operation with `creditsPerExecution: 0` | `providerCostPerCredit: null`, `revenuePerExecution: $0`, `grossMargin: null`; gross profit is still the negative of the provider cost |
| Scenario with `packagePrice: $0`        | a real free plan: `effectiveRevenuePerCredit: $0`, revenue `$0`, `grossMargin: null`                                                   |
| Scenario with no spendable credits      | `effectiveRevenuePerCredit: null`, and revenue, profit and margin `null` — nothing is divided by zero                                  |
| No applicable scenario                  | no entry at all, rather than a scenario priced at zero                                                                                 |

## Credits are a product decision

`creditsPerExecution` is never derived, recommended, or normalised from provider cost. An administrator may deliberately charge 1 credit for Resume Export, 10 for Job Insights, and 20 for Cover Letter even though their provider costs are nowhere near proportional, because perceived value and infrastructure cost are different things.

This package reports the financial consequence of that decision. It does not make it.
