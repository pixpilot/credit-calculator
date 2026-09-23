# @pixpilot/credit-pricing-calculator-ui

React editor for `@pixpilot/credit-pricing-calculator`, in the same relationship `@pixpilot/credit-allocation-calculator-ui` has to its own calculation package: every number on screen is produced by the calculation package, and no financial arithmetic happens inside a component.

```tsx
import { CreditPricingCalculator } from '@pixpilot/credit-pricing-calculator-ui';

<CreditPricingCalculator
  defaultValue={[
    {
      id: 'insights',
      label: 'Job Insights',
      providerCostPerExecution: 0.002852,
      creditsPerExecution: 5,
    },
  ]}
  defaultOptions={{ targetGrossMargin: 80, safetyBuffer: 0 }}
/>;
```

The table is both the editor and the result — each row carries the feature's provider cost and credit allocation and the per-credit cost they produce, so there is no second results table to scroll to. The summary stays pinned above it, and the target margin and safety buffer live inside it: every control on the screen changes the price shown beside it.

Provider cost and selling price are never abbreviated to the same word. A figure is labelled either as what a credit **costs us** — `Provider cost / credit` — or as what a credit **sells for** — `Minimum credit price`.

## Pricing an allocation

`createCreditPricingFeatures` turns a calculated credit allocation into the features this editor starts from:

```tsx
import { createCreditPricingFeatures } from '@pixpilot/credit-pricing-calculator';
import { CreditPricingCalculator } from '@pixpilot/credit-pricing-calculator-ui';

<CreditPricingCalculator defaultValue={createCreditPricingFeatures(allocationResult)} />;
```

## Props

- `defaultValue` / `value` / `onChange` — the features, controlled or self-contained, matching `CreditAllocationCalculator`.
- `defaultOptions` / `options` / `onOptionsChange` — the target gross margin and safety buffer, held separately so editing one does not disturb the other.
- `title` — `null` when the host page already names the calculator.
- `className` — replaces the section's default spacing.

Pass `roundUpToDecimalPlaces` in the options to have the summary show a recommended price alongside the calculated minimum; without it, only the minimum is shown.

## Editing

Every control reports only values the calculator accepts, because it validates its input and throws on anything else. A half-typed `0.` stays on screen without repricing anything, and a 100% gross margin — which no price satisfies — is refused at the keystroke rather than surfacing as a divide by zero.

Provider costs are edited as text rather than through a number input, so an amount like `0.0000005` stays exactly that instead of becoming `5e-7` or being rounded away.
