# @pixpilot/credit-usage-calculator-ui

Reusable React UI for the pure [`@pixpilot/credit-usage-calculator`](../credit-calculator/README.md) domain package. It renders generic credit usage sliders and never relies on application-specific features.

## Peer requirements

The consuming application needs React 18 or 19, React DOM, and the workspace shadcn styles.

## Example

```tsx
import { CreditCalculator } from '@pixpilot/credit-usage-calculator-ui';

<CreditCalculator
  credits={500}
  features={[
    { id: 'analysis', label: 'AI Analysis', creditCost: 5 },
    { id: 'message', label: 'AI message', creditCost: 1 },
  ]}
  initialUsage={[{ featureId: 'analysis', quantity: 50 }]}
  onUsageChange={(usage) => console.log(usage)}
/>;
```

Pass `usage`, `credits` and `selectedFeatureId` to control the component. Otherwise use `initialUsage`, `initialCredits` and `initialSelectedFeatureId` for unmanaged state. A `selectedFeatureId` of `null` represents the All features view.

## Two views

Selecting one feature asks the spending question — this much balance, how far does it go — and shows an editable balance beside the view selector. Omit `credits` and `initialCredits` to open on the package default of 500; pass `credits` to own the value yourself and drive it from `onCreditsChange`.

The All features view asks the buying question instead: set out everything you expect to do and read off what it comes to. It has no balance, so every slider runs to `plannedQuantityLimit` (100 by default) and the running total replaces the balance field.
