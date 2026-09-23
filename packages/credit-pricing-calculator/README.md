# @pixpilot/credit-pricing-calculator

Pure, validated calculation of what one credit has to sell for.

It is one of six calculators over the same business, and the first that looks at what we charge:

| Package                                      | Answers                                                           |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `@pixpilot/cost-calculator`                  | what one operation costs us to run                                |
| `@pixpilot/credit-allocation-calculator`     | how that cost spreads across the credits an administrator assigns |
| `@pixpilot/credit-pricing-calculator`        | what one credit must sell for to reach a target gross margin      |
| `@pixpilot/credit-package-sizing-calculator` | how many credits a package price may include, and what it earns   |
| `@pixpilot/credit-package-margin-calculator` | what margin the packages already on sale earn                     |
| `@pixpilot/credit-usage-calculator`          | what a customer's credit balance buys them                        |

## Three figures that are easy to confuse

- **`providerCostPerExecution`** — what one run of a feature costs **us**. It comes from a cost or allocation calculation and is never derived from credits.
- **`providerCostPerCredit`** — what one allocated credit represents in actual provider cost: the execution cost spread over the credits that execution charges.
- **`minimumCreditPrice`** — the least we should effectively **sell** one credit for to reach the target gross margin.

The first two are cost. The third is price. Nothing in this result abbreviates both to "cost per credit".

```ts
import { calculateCreditPricing } from '@pixpilot/credit-pricing-calculator';

const result = calculateCreditPricing(
  [
    {
      id: 'insights',
      label: 'Job Insights',
      providerCostPerExecution: 0.002852,
      creditsPerExecution: 5,
    },
    {
      id: 'resume-export',
      label: 'Resume Export',
      providerCostPerExecution: 0.0005,
      creditsPerExecution: 1,
    },
  ],
  { targetGrossMargin: 80 },
);

result.worstCaseProviderCostPerCredit; // { amount: '0.0005704', currency: 'USD' }
result.worstCaseFeatureId; // 'insights'
result.minimumCreditPrice; // { amount: '0.002852', currency: 'USD' }
```

Nothing product-specific lives in the package: features are supplied by the caller and can be added, removed, renamed, or repriced without touching it.

## The calculation

```text
providerCostPerCredit =
  providerCostPerExecution / creditsPerExecution

worstCaseProviderCostPerCredit =
  max(providerCostPerCredit of every enabled feature that charges credits)

bufferedProviderCostPerCredit =
  worstCaseProviderCostPerCredit × (1 + safetyBuffer)

minimumCreditPrice =
  bufferedProviderCostPerCredit / (1 - targetGrossMargin)
```

The price is built from the **worst** cost per credit, never the average. A price that only covers the mean loses money on every execution of the feature above it, while the arithmetic still reads as profitable.

`targetGrossMargin` is a gross margin — `(revenue - provider cost) / revenue` — not a markup on cost. An 80% margin and a 400% markup are the same price, and treating one as the other prices a credit at a fifth of what it needs.

`safetyBuffer` covers actual token or infrastructure usage running above the estimate. It is applied to provider cost **before** the margin, so the margin is earned on top of the padded cost rather than out of it. It defaults to `0`.

## Credits stay a business decision

`creditsPerExecution` is never adjusted here. Changing it moves only what one credit represents:

```text
Job Insights at 5 credits   → $0.002852 / 5  = $0.0005704 per credit
Job Insights at 10 credits  → $0.002852 / 10 = $0.0002852 per credit
```

`providerCostPerExecution` is identical in both cases. Charging more credits for the same execution lowers the cost each credit carries, and so may lower the price each credit needs. That is the question the calculator exists to answer: _given how many credits I decided each feature consumes, what does one credit need to sell for?_

## Inputs

- `features[].providerCostPerExecution` — an exact `Money` from a cost or allocation calculation, or a non-negative number.
- `features[].creditsPerExecution` — a non-negative whole number; `0` models a deliberately free feature.
- `features[].enabled` — defaults to `true`. A disabled feature is still costed, but never sets the credit price.
- `options.targetGrossMargin` — a percentage, `0 ≤ x < 100`.
- `options.safetyBuffer` — a percentage, `≥ 0`, default `0`.
- `options.roundUpToDecimalPlaces` — see below; omitted by default.

A gross margin of 100% is rejected rather than answered: `1 - margin` is zero, and no price satisfies it.

## Results

Overall: `worstCaseProviderCostPerCredit`, `worstCaseFeatureId`, `bufferedProviderCostPerCredit`, `minimumCreditPrice`, `recommendedCreditPrice`, and the `targetGrossMargin` and `safetyBuffer` the result was calculated with.

Per feature: `providerCostPerExecution`, `creditsPerExecution`, `enabled`, `providerCostPerCredit`, `bufferedProviderCostPerCredit`, `marginAtCalculatedCreditPrice`, and `isPriceSetting` — true for the one feature the credit price was built from.

### Features that charge nothing

A feature with `creditsPerExecution: 0` has no cost per credit to compare, so its `providerCostPerCredit` is `null` and it takes no part in choosing the worst case. When no enabled feature charges credits, `worstCaseProviderCostPerCredit`, `bufferedProviderCostPerCredit`, and `minimumCreditPrice` are all `null`. Nothing is ever returned as `NaN` or `Infinity`.

### The recommended price

`minimumCreditPrice` is the exact threshold the target margin requires. `recommendedCreditPrice` is that figure rounded **up** to `options.roundUpToDecimalPlaces` decimal places — never down, so a recommendation always still clears the minimum:

```ts
calculateCreditPricing(features, { targetGrossMargin: 80, roundUpToDecimalPlaces: 3 });
// minimumCreditPrice:     { amount: '0.002852', currency: 'USD' }
// recommendedCreditPrice: { amount: '0.003',    currency: 'USD' }
```

There is no rounding rule of the calculator's own here: with `roundUpToDecimalPlaces` omitted, `recommendedCreditPrice` is `null` and only the calculated minimum is reported.

`marginAtCalculatedCreditPrice` is measured against the price the calculation settled on — the recommended price when there is one, the minimum otherwise — so it reads back as the target margin when no buffer or rounding was applied, and above it when either was.

## Money and precision

Amounts are the exact decimal `Money` values of `@pixpilot/cost-calculator`, and every step runs through its `bigint` arithmetic — `divideMoney` to spread a cost across credits, `multiplyMoney` and `divideMoney` to apply the buffer and the margin. Percentages are held as whole micro-percent rather than as floats, so a margin of `12.5%` is exactly that and not `0.12500000000000003`. No monetary value is ever built from, or passed through, a JavaScript float.

## Pricing an allocation

`createCreditPricingFeatures(allocationResult)` maps a calculated credit allocation into these features, carrying each operation's exact `costPerExecution` and assigned `creditsPerExecution` across untouched:

```ts
const allocation = calculateCreditAllocation(operations, model);
const pricing = calculateCreditPricing(createCreditPricingFeatures(allocation), {
  targetGrossMargin: 80,
});
```

The adapter reads the allocation structurally, so this package does not depend on `@pixpilot/credit-allocation-calculator` and stays usable on its own: anything that already knows what an execution costs and how many credits it charges can be priced.
