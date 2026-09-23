# @pixpilot/credit-allocation-calculator-ui

React editor for `@pixpilot/credit-allocation-calculator`, in the same relationship `@pixpilot/cost-calculator-ui` has to `@pixpilot/cost-calculator`: every number on screen is produced by the calculation package, and no financial arithmetic happens inside a component.

```tsx
import { CreditAllocationCalculator } from '@pixpilot/credit-allocation-calculator-ui';

<CreditAllocationCalculator
  defaultValue={operations}
  model={{ inputPricePerMillionTokens: 0.15, outputPricePerMillionTokens: 0.6 }}
/>;
```

The table is both the editor and the simulation result — each row carries the operation's two sliders and every figure they produce, so there is no second results table to scroll to. The totals stay pinned above it.

`PROVIDER COST / CREDIT` is what one allocated credit costs the business to honour. It is not the price of a credit; that comes from a pricing scenario.

## Pricing the allocation against a plan or credit pack

Pass `pricingScenarios` and the summary gains a scenario picker, and each row gains what the customer pays and the margin it earns:

```tsx
<CreditAllocationCalculator
  defaultValue={operations}
  model={model}
  pricingScenarios={[
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
  ]}
/>
```

Switching scenarios reprices what the allocation earns and leaves what it costs to run exactly where it was — which is the comparison the screen exists to make. With no scenarios the calculator shows provider cost alone, as it did before pricing existed.

## Pricing an allocation from a cost scenario

`useCostBackedCreditAllocation` derives the allocation from cost batches the host is still editing, keeping only the administrator's decisions — runs and credits per execution — as state:

```tsx
const allocation = useCostBackedCreditAllocation(costBatches);

<CreditAllocationCalculator
  defaultValue={allocation.value}
  model={selectedModel}
  value={allocation.value}
  onChange={allocation.onChange}
/>;
```

Updating the `model` prop reprices the allocation immediately, while the runs and credits already set survive it — they are keyed by operation id rather than by position.

## Props

- `defaultValue` / `value` / `onChange` — controlled or self-contained, matching `CostCalculator`.
- `model` — the one model whose token rates price every operation.
- `maxCreditsPerExecution` — upper bound of the credits slider.
- `maxRuns` — upper bound of each operation's runs slider.
- `pricingScenarios` — the plans and credit packs to read the allocation against; omit for provider cost alone.
- `title` — `null` when the host page already names the calculator.
