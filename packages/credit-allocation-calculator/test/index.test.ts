import type { CostBatch, ModelPricing } from '@pixpilot/cost-calculator';

import type { CreditAllocationOperation } from '../src/index.ts';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  calculateCreditAllocation,
  createCreditAllocationOperations,
  DEFAULT_CREDITS_PER_EXECUTION,
} from '../src/index.ts';

const model: ModelPricing = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

/** 10k in + 1k out at the selected rates costs exactly $0.0021 per run. */
const tokenOperation: CreditAllocationOperation = {
  creditsPerExecution: 3,
  id: 'alpha',
  label: 'Alpha',
  paths: [
    {
      inputTokens: 10_000,
      name: 'AI analysis',
      outputTokens: 1_000,
      type: 'tokens',
    },
  ],
  runs: 50,
};

/** A non-AI operation, costing exactly $0.0005 per run. */
const fixedOperation: CreditAllocationOperation = {
  creditsPerExecution: 1,
  id: 'beta',
  label: 'Beta',
  paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
  runs: 50,
};

const baseInput: CreditAllocationOperation[] = [tokenOperation, fixedOperation];

function withOperations(
  ...operations: CreditAllocationOperation[]
): CreditAllocationOperation[] {
  return operations;
}

describe('calculateCreditAllocation', () => {
  it('should price a token operation from the supplied model rather than credits', () => {
    const result = calculateCreditAllocation(withOperations(tokenOperation), model);

    expect(result.operations[0]).toMatchObject({
      costPerExecution: { amount: '0.0021', currency: 'USD' },
      id: 'alpha',
      label: 'Alpha',
    });
    expect(result.operations[0]?.costPaths[0]).toMatchObject({
      inputCost: { amount: '0.0015', currency: 'USD' },
      outputCost: { amount: '0.0006', currency: 'USD' },
      type: 'tokens',
    });
  });

  it('should use one model for every token path in an operation', () => {
    const result = calculateCreditAllocation(
      withOperations({
        ...tokenOperation,
        paths: [
          ...tokenOperation.paths,
          { costPerExecution: 0.0005, name: 'Worker execution', type: 'fixed' },
          {
            inputTokens: 1_000,
            name: 'Review pass',
            outputTokens: 500,
            type: 'tokens',
          },
        ],
      }),
      model,
    );

    expect(result.operations[0]?.costPerExecution).toEqual({
      amount: '0.00305',
      currency: 'USD',
    });
    expect(result.operations[0]?.costPaths).toHaveLength(3);
  });

  it('should calculate fixed costs without model-specific paths', () => {
    const result = calculateCreditAllocation([fixedOperation], model);

    expect(result.operations[0]).toMatchObject({
      cost: { amount: '0.025', currency: 'USD' },
      costPerExecution: { amount: '0.0005', currency: 'USD' },
      runs: 50,
    });
  });

  it('should report total runs, credits, cost, and weighted cost per credit', () => {
    const result = calculateCreditAllocation(baseInput, model);

    expect(result.totalRuns).toBe(100);
    expect(result.totalCredits).toBe(200);
    expect(result.totalCost).toEqual({ amount: '0.13', currency: 'USD' });
    expect(result.providerCostPerCredit).toEqual({ amount: '0.00065', currency: 'USD' });
  });

  it('should preserve infrastructure cost when only credits change', () => {
    const before = calculateCreditAllocation(baseInput, model);
    const after = calculateCreditAllocation(
      withOperations({ ...tokenOperation, creditsPerExecution: 6 }, fixedOperation),
      model,
    );

    expect(after.totalCost).toEqual(before.totalCost);
    expect(after.operations[0]?.cost).toEqual(before.operations[0]?.cost);
    expect(after.totalCredits).toBe(350);
    expect(after.operations[0]?.providerCostPerCredit).toEqual({
      amount: '0.00035',
      currency: 'USD',
    });
  });

  it('should calculate nothing for an operation with no selected runs', () => {
    const result = calculateCreditAllocation(
      withOperations({ ...tokenOperation, runs: 100 }, { ...fixedOperation, runs: 0 }),
      model,
    );

    expect(result.operations[1]).toMatchObject({
      cost: { amount: '0', currency: 'USD' },
      credits: 0,
      runs: 0,
    });
    expect(result.totalCost).toEqual({ amount: '0.21', currency: 'USD' });
  });

  it('should keep very small monetary values exact instead of rounding them away', () => {
    const result = calculateCreditAllocation(
      [
        {
          creditsPerExecution: 1,
          id: 'micro',
          label: 'Micro',
          paths: [{ costPerExecution: 0.0000000001, name: 'Edge call', type: 'fixed' }],
          runs: 7,
        },
      ],
      model,
    );

    expect(result.operations[0]?.costPerExecution).toEqual({
      amount: '0.0000000001',
      currency: 'USD',
    });
    expect(result.totalCost).toEqual({ amount: '0.0000000007', currency: 'USD' });
  });
});

describe('credit allocation validation', () => {
  it('should reject invalid operation values', () => {
    expect(() =>
      calculateCreditAllocation(withOperations({ ...tokenOperation, runs: -1 }), model),
    ).toThrow(ZodError);
    expect(() =>
      calculateCreditAllocation(withOperations({ ...tokenOperation, runs: 1.5 }), model),
    ).toThrow(ZodError);
    expect(() =>
      calculateCreditAllocation(withOperations(tokenOperation, tokenOperation), model),
    ).toThrow(/must be unique/u);
  });

  it('should reject invalid token pricing', () => {
    expect(() =>
      calculateCreditAllocation(withOperations(tokenOperation), {
        inputPricePerMillionTokens: -1,
        outputPricePerMillionTokens: 0.6,
      }),
    ).toThrow(ZodError);
  });
});

describe('createCreditAllocationOperations', () => {
  const costBatches: CostBatch[] = [
    {
      name: 'Job Insights',
      paths: [
        {
          inputTokens: 15_000,
          name: 'AI operation',
          outputTokens: 1_000,
          type: 'tokens',
        },
      ],
      quantity: 100,
    },
    {
      name: 'Resume Export',
      paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
      quantity: 50,
    },
  ];

  it('should seed run counts and preserve paths without copying model lists', () => {
    const operations = createCreditAllocationOperations(costBatches);

    expect(operations.map((operation) => operation.runs)).toEqual([100, 50]);
    expect(operations[0]?.creditsPerExecution).toBe(DEFAULT_CREDITS_PER_EXECUTION);
    expect(operations[0]?.paths).toEqual(costBatches[0]?.paths);
    expect(
      calculateCreditAllocation(operations, model).operations[0]?.costPerExecution,
    ).toEqual({
      amount: '0.00285',
      currency: 'USD',
    });
  });

  it('should start every operation on one credits-per-execution when given a number', () => {
    const operations = createCreditAllocationOperations(costBatches, {
      creditsPerExecution: 7,
    });

    expect(operations.map((operation) => operation.creditsPerExecution)).toEqual([7, 7]);
  });

  it('should charge each named batch the credits its feature charges', () => {
    const operations = createCreditAllocationOperations(costBatches, {
      creditsPerExecution: { 'Job Insights': 10, 'Resume Export': 5 },
    });

    expect(operations.map((operation) => operation.creditsPerExecution)).toEqual([10, 5]);
  });

  it('should leave a batch the credit record does not name on the default', () => {
    const operations = createCreditAllocationOperations(costBatches, {
      creditsPerExecution: { 'Job Insights': 10 },
    });

    expect(operations.map((operation) => operation.creditsPerExecution)).toEqual([
      10,
      DEFAULT_CREDITS_PER_EXECUTION,
    ]);
  });

  it('should keep matching credits to batches by name when one is removed', () => {
    const operations = createCreditAllocationOperations(costBatches.slice(1), {
      creditsPerExecution: { 'Job Insights': 10, 'Resume Export': 5 },
    });

    expect(operations.map((operation) => operation.creditsPerExecution)).toEqual([5]);
  });

  it('should give operations unique ids even when batch names repeat', () => {
    const operations = createCreditAllocationOperations(
      costBatches.map((batch) => ({ ...batch, name: 'Export' })),
    );

    expect(operations.map((operation) => operation.id)).toEqual(['Export', 'Export (2)']);
    expect(() => calculateCreditAllocation(operations, model)).not.toThrow();
  });
});
