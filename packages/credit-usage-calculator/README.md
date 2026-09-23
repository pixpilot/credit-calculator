# @pixpilot/credit-usage-calculator

Pure, user-facing credit usage calculations. This package has no React or application dependencies and can be used from UI code, scripts, or tests.

## Install and import

```ts
import { calculateCreditUsage } from '@pixpilot/credit-usage-calculator';
```

## Example

```ts
const result = calculateCreditUsage({
  credits: 500,
  features: [
    { id: 'analysis', label: 'AI Analysis', creditCost: 5 },
    { id: 'message', label: 'AI message', creditCost: 1 },
  ],
  usage: [{ featureId: 'analysis', quantity: 50 }],
});

// result.usedCredits === 250
// result.remainingCredits === 250
// result.equivalents includes 250 AI messages
```

Inputs are validated at runtime with Zod. Credits and quantities must be non-negative integers, feature costs must be positive integers, and configured feature IDs (and usage entries) must be unique.

Use `calculateSingleFeatureUsage` when a consumer is intentionally modelling one feature. It returns the selected feature and omits it from the remaining-credit equivalents.
