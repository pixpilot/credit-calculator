# @pixpilot/cost-calculator

Pure, validated cost calculation for internal provider and infrastructure operations.

```ts
import { calculateCost } from '@pixpilot/cost-calculator';

const model = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

const result = calculateCost(
  [
    {
      name: 'Analysis',
      quantity: 500,
      paths: [
        {
          name: 'AI analysis',
          type: 'tokens',
          inputTokens: 8_000,
          outputTokens: 2_000,
        },
      ],
    },
  ],
  model,
);
```

Each invocation prices every token path at the one supplied model. Costs are accumulated with exact `bigint` arithmetic and returned as decimal USD strings in `Money` objects. Validate untrusted batches with `costBatchesSchema` and pricing with `modelPricingSchema` before storing them; `calculateCost` validates both values on every invocation as well.

## Money arithmetic

Amounts are decimal strings, so anything further done with them belongs here rather than in a consumer that would have to reach for a float:

- `sumMoney(amounts)` — totals exact amounts, so a rollup always equals its own rows.
- `multiplyMoney(money, quantity)` — repeats an amount a whole number of times, giving exactly what `calculateCost` produces for the same quantity.
- `divideMoney(money, divisor)` — splits an amount into equal parts, rounding half up at the precision the calculator keeps.
- `ZERO_USD` — the canonical zero amount.
