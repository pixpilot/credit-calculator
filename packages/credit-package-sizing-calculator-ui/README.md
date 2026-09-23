# @pixpilot/credit-package-sizing-calculator-ui

The editable admin screen for `@pixpilot/credit-package-sizing-calculator`.

It owns no financial arithmetic. Every figure comes from `calculatePricingSummary`, recalculated on the keystroke, so nothing on screen can disagree with the inputs that produced it.

```tsx
import { CreditPackageSizingCalculator } from '@pixpilot/credit-package-sizing-calculator-ui';

<CreditPackageSizingCalculator defaultValue={ADMIN_CREDIT_FEATURE_SCENARIOS} />;
```

`defaultValue` takes features in their loosest form — a name, and whatever estimates the caller happens to have — so an application's existing cost-calculator scenario list can be handed over as it stands. Pass `value` and `onChange` to control the table instead; `onChange` always reports normalised rows with stable ids.

## Panels

| Panel                         | Answers                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| Model & pricing assumptions   | the token rates, package, margin and buffer everything is priced against |
| Recommendation cards          | what is on sale, what it earns, what to sell instead                     |
| Feature costs                 | the per-feature costs the whole model is derived from                    |
| Cost per credit & safe limits | the working: allowed COGS, and the two safe credit limits                |
| Margins, profit & free tier   | profit per credit and per package, and what the free allowance costs     |
| Package sizes                 | the same price buying 500, 700 or 1,000 credits, side by side            |

## Notes

- **Nothing is persisted.** The screen is a model to argue with, not configuration the product reads. No production credit cost, Stripe price, or balance is touched.
- **Inputs report only valid figures.** The calculator validates its input and throws on anything else, so a cleared box keeps its draft on screen while the calculation behind it keeps the last figure it could use.
- **Margin states are named, not coloured.** `Healthy`, `Acceptable`, `Below target` and `Not calculable` each carry text and an icon.
- **Currency is a prop.** Pass `format={{ currency, locale }}` to price in something other than United States dollars; every panel reads its figures through the same formatters.
