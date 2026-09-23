import type { CostBatch, ModelPricing } from '../src/index.ts';

import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import {
  calculateCost,
  costBatchesSchema,
  divideMoney,
  modelPricingSchema,
  multiplyMoney,
  sumMoney,
  ZERO_USD,
} from '../src/index.ts';

const model: ModelPricing = {
  inputPricePerMillionTokens: 0.15,
  metadata: { model: 'fast-model', provider: 'example-provider' },
  outputPricePerMillionTokens: 0.6,
};

describe('calculateCost', () => {
  it('should calculate token input and output pricing from the supplied model', () => {
    const result = calculateCost(
      [
        {
          name: 'Job Insights',
          paths: [
            {
              inputTokens: 8_000,
              name: 'AI Analysis',
              outputTokens: 2_000,
              type: 'tokens',
            },
          ],
          quantity: 500,
        },
      ],
      model,
    );

    expect(result.batches[0]).toMatchObject({
      costPerExecution: { amount: '0.0024', currency: 'USD' },
      totalCost: { amount: '1.2', currency: 'USD' },
    });
    expect(result.batches[0]?.paths[0]).toMatchObject({
      inputCost: { amount: '0.0012', currency: 'USD' },
      modelMetadata: { model: 'fast-model', provider: 'example-provider' },
      outputCost: { amount: '0.0012', currency: 'USD' },
    });
  });

  it('should use the same model for every token path in a batch', () => {
    const result = calculateCost(
      [
        {
          name: 'Tailored Resume',
          paths: [
            {
              inputTokens: 15_000,
              name: 'AI Generation',
              outputTokens: 5_000,
              type: 'tokens',
            },
            {
              inputTokens: 1_000,
              name: 'Review pass',
              outputTokens: 500,
              type: 'tokens',
            },
            { costPerExecution: 0.003, name: 'PDF Generation', type: 'fixed' },
          ],
          quantity: 100,
        },
      ],
      model,
    );

    expect(result.batches[0]).toMatchObject({
      costPerExecution: { amount: '0.0087', currency: 'USD' },
      totalCost: { amount: '0.87', currency: 'USD' },
    });
  });

  it('should calculate fixed execution costs and apply batch quantities', () => {
    const result = calculateCost(
      [
        {
          name: 'Resume PDF',
          paths: [{ costPerExecution: 0.003, name: 'PDF Generation', type: 'fixed' }],
          quantity: 200,
        },
      ],
      model,
    );

    expect(result.batches[0]).toMatchObject({
      costPerExecution: { amount: '0.003', currency: 'USD' },
      totalCost: { amount: '0.6', currency: 'USD' },
    });
    expect(result.grandTotal).toEqual({ amount: '0.6', currency: 'USD' });
  });

  it('should preserve very small provider costs without floating-point drift', () => {
    const result = calculateCost(
      [
        {
          name: 'Tiny operation',
          paths: [
            {
              inputTokens: 1,
              name: 'Tiny input',
              outputTokens: 1,
              type: 'tokens',
            },
          ],
          quantity: 3,
        },
      ],
      { inputPricePerMillionTokens: 0.000001, outputPricePerMillionTokens: 0.000001 },
    );

    expect(result.batches[0]).toMatchObject({
      costPerExecution: { amount: '0.000000000002', currency: 'USD' },
      totalCost: { amount: '0.000000000006', currency: 'USD' },
    });
  });

  it('should reject invalid calculator inputs and model prices', () => {
    const input: CostBatch[] = [
      {
        name: 'Invalid batch',
        paths: [{ costPerExecution: -0.01, name: 'PDF', type: 'fixed' }],
        quantity: 1.5,
      },
    ];

    expect(costBatchesSchema.safeParse(input).success).toBe(false);
    expect(
      modelPricingSchema.safeParse({
        inputPricePerMillionTokens: -1,
        outputPricePerMillionTokens: 0.6,
      }).success,
    ).toBe(false);
    expect(() => calculateCost(input, model)).toThrow(ZodError);
  });
});

describe('divideMoney', () => {
  it('should split an exact amount into equal per-unit rates', () => {
    expect(divideMoney({ amount: '0.13', currency: 'USD' }, 200)).toEqual({
      amount: '0.00065',
      currency: 'USD',
    });
  });

  it('should round half up rather than truncate a remainder', () => {
    expect(
      divideMoney({ amount: '0.000000000000000000000000000003', currency: 'USD' }, 2),
    ).toEqual({
      amount: '0.000000000000000000000000000002',
      currency: 'USD',
    });
  });

  it('should keep a division of the zero amount at zero', () => {
    expect(divideMoney(ZERO_USD, 7)).toEqual(ZERO_USD);
  });

  it('should refuse divisors that are not positive whole numbers', () => {
    expect(() => divideMoney({ amount: '1', currency: 'USD' }, 0)).toThrow(
      /positive whole number/u,
    );
    expect(() => divideMoney({ amount: '1', currency: 'USD' }, 1.5)).toThrow(
      /positive whole number/u,
    );
  });
});

describe('multiplyMoney', () => {
  it('should repeat an exact amount a whole number of times', () => {
    expect(multiplyMoney({ amount: '0.0021', currency: 'USD' }, 50)).toEqual({
      amount: '0.105',
      currency: 'USD',
    });
  });

  it('should agree with the quantity the cost calculator itself applies', () => {
    const batch: CostBatch = {
      name: 'Tailored Resume',
      paths: [
        {
          inputTokens: 15_000,
          name: 'AI Generation',
          outputTokens: 5_000,
          type: 'tokens',
        },
        { costPerExecution: 0.003, name: 'PDF Generation', type: 'fixed' },
      ],
      quantity: 137,
    };
    const result = calculateCost([batch], model);
    const perExecution = calculateCost([{ ...batch, quantity: 1 }], model);

    expect(multiplyMoney(perExecution.batches[0]!.costPerExecution, 137)).toEqual(
      result.batches[0]?.totalCost,
    );
  });

  it('should keep a repeated sub-cent amount free of floating-point drift', () => {
    expect(multiplyMoney({ amount: '0.000000000002', currency: 'USD' }, 3)).toEqual({
      amount: '0.000000000006',
      currency: 'USD',
    });
  });

  it('should return nothing for no repetitions at all', () => {
    expect(multiplyMoney({ amount: '12.34', currency: 'USD' }, 0)).toEqual(ZERO_USD);
  });

  it('should refuse quantities that are not non-negative whole numbers', () => {
    expect(() => multiplyMoney({ amount: '1', currency: 'USD' }, -1)).toThrow(
      /non-negative whole number/u,
    );
    expect(() => multiplyMoney({ amount: '1', currency: 'USD' }, 2.5)).toThrow(
      /non-negative whole number/u,
    );
  });
});

describe('sumMoney', () => {
  it('should add exact amounts without rounding any of them first', () => {
    expect(
      sumMoney([
        { amount: '0.105', currency: 'USD' },
        { amount: '0.025', currency: 'USD' },
      ]),
    ).toEqual({ amount: '0.13', currency: 'USD' });
  });

  it('should total nothing for an empty list', () => {
    expect(sumMoney([])).toEqual(ZERO_USD);
  });

  it('should agree with the grand total the cost calculator produces', () => {
    const result = calculateCost(
      [
        {
          name: 'Job Insights',
          paths: [
            {
              inputTokens: 8_000,
              name: 'AI Analysis',
              outputTokens: 2_000,
              type: 'tokens',
            },
          ],
          quantity: 500,
        },
        {
          name: 'Resume PDF',
          paths: [{ costPerExecution: 0.003, name: 'PDF Generation', type: 'fixed' }],
          quantity: 200,
        },
      ],
      model,
    );

    expect(sumMoney(result.batches.map((batch) => batch.totalCost))).toEqual(
      result.grandTotal,
    );
  });

  it('should keep amounts far below a cent out of the rounding', () => {
    expect(
      sumMoney([
        { amount: '0.000000000000000000000000000001', currency: 'USD' },
        { amount: '0.000000000000000000000000000002', currency: 'USD' },
      ]),
    ).toEqual({ amount: '0.000000000000000000000000000003', currency: 'USD' });
  });
});
