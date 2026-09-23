# @pixpilot/cost-calculator-ui

Reusable React editor for `@pixpilot/cost-calculator`. The package keeps only editing state and delegates every price calculation to the core package.

```tsx
import { CostCalculator } from '@pixpilot/cost-calculator-ui';

<CostCalculator
  defaultValue={initialBatches}
  model={{ inputPricePerMillionTokens: 0.15, outputPricePerMillionTokens: 0.6 }}
  onChange={setBatches}
/>;
```

Pass a controlled `value` when the application owns persistence, or `defaultValue` for an isolated interactive calculator. The required `model` prices every token path and can carry provider and model metadata supplied by the hosting application.
