import type { Money } from '@pixpilot/cost-calculator';

import type { CreditAllocationOperation, CreditAllocationResult } from '../src/index.ts';
import { multiplyMoney, sumMoney } from '@pixpilot/cost-calculator';
import { describe, expect, it } from 'vitest';

import { calculateCreditAllocation } from '../src/index.ts';

/**
 * These tests hold the arithmetic itself to account rather than a set of
 * hand-copied figures: every total is re-derived from the operation's own
 * per-execution cost in exact units and compared, so a rounding change
 * anywhere in the money layer fails here rather than reaching the screen as a
 * summary that disagrees with the rows above it.
 */

const model = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

const DECIMAL_PLACES = 30;
const USD_SCALE = 10n ** BigInt(DECIMAL_PLACES);
const NOTHING = 0n;

/** Reads a calculator amount as exact atomic units, for equality without rounding. */
function atomic(money: Money): bigint {
  const [whole = '0', fraction = ''] = money.amount.split('.');

  return (
    BigInt(whole) * USD_SCALE +
    BigInt(fraction.slice(0, DECIMAL_PLACES).padEnd(DECIMAL_PLACES, '0'))
  );
}

/** 10k in + 1k out costs exactly $0.0021 per run at the model above. */
function tokenOperation(
  overrides: Partial<CreditAllocationOperation> = {},
): CreditAllocationOperation {
  return {
    creditsPerExecution: 3,
    id: 'insights',
    label: 'Job Insights',
    paths: [
      { inputTokens: 10_000, name: 'AI analysis', outputTokens: 1_000, type: 'tokens' },
    ],
    runs: 50,
    ...overrides,
  };
}

/** A non-AI operation costing exactly $0.0005 per run. */
function fixedOperation(
  overrides: Partial<CreditAllocationOperation> = {},
): CreditAllocationOperation {
  return {
    creditsPerExecution: 1,
    id: 'export',
    label: 'Resume Export',
    paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
    runs: 50,
    ...overrides,
  };
}

/** An operation whose per-run cost lands far below a displayable cent. */
function micropennyOperation(
  overrides: Partial<CreditAllocationOperation> = {},
): CreditAllocationOperation {
  return {
    creditsPerExecution: 1,
    id: 'ping',
    label: 'Edge ping',
    paths: [{ costPerExecution: 0.0000000001, name: 'Edge call', type: 'fixed' }],
    runs: 3,
    ...overrides,
  };
}

/** Asserts the invariants that must hold for any allocation, of any size. */
function expectConsistent(result: CreditAllocationResult): void {
  for (const operation of result.operations) {
    expect(atomic(operation.cost)).toBe(
      atomic(operation.costPerExecution) * BigInt(operation.runs),
    );
    expect(operation.credits).toBe(operation.runs * operation.creditsPerExecution);
    expect(atomic(sumMoney(operation.costPaths.map((path) => path.totalCost)))).toBe(
      atomic(operation.cost),
    );
    expect(
      atomic(sumMoney(operation.costPaths.map((path) => path.costPerExecution))),
    ).toBe(atomic(operation.costPerExecution));
  }

  expect(atomic(sumMoney(result.operations.map((operation) => operation.cost)))).toBe(
    atomic(result.totalCost),
  );
  expect(result.totalRuns).toBe(
    result.operations.reduce((total, operation) => total + operation.runs, 0),
  );
  expect(result.totalCredits).toBe(
    result.operations.reduce((total, operation) => total + operation.credits, 0),
  );
}

describe('a single feature', () => {
  it('should multiply its per-run cost by its runs and report both', () => {
    const result = calculateCreditAllocation([tokenOperation()], model);

    expect(result.operations[0]?.costPerExecution).toEqual({
      amount: '0.0021',
      currency: 'USD',
    });
    expect(result.operations[0]?.cost).toEqual({ amount: '0.105', currency: 'USD' });
    expect(result.totalCost).toEqual({ amount: '0.105', currency: 'USD' });
    expectConsistent(result);
  });

  it.each([0, 1, 2, 7, 50, 999, 1_000_000])(
    'should scale the feature and grand totals together at %i runs',
    (runs) => {
      const result = calculateCreditAllocation([tokenOperation({ runs })], model);
      const operation = result.operations[0]!;

      expect(operation.cost).toEqual(multiplyMoney(operation.costPerExecution, runs));
      expect(result.totalCost).toEqual(operation.cost);
      expect(result.totalRuns).toBe(runs);
      expect(result.totalCredits).toBe(runs * 3);
      expectConsistent(result);
    },
  );

  it('should scale every path in its breakdown by the same runs', () => {
    const result = calculateCreditAllocation(
      [
        tokenOperation({
          paths: [
            {
              inputTokens: 10_000,
              name: 'AI analysis',
              outputTokens: 1_000,
              type: 'tokens',
            },
            { costPerExecution: 0.0005, name: 'Worker execution', type: 'fixed' },
          ],
          runs: 20,
        }),
      ],
      model,
    );
    const operation = result.operations[0]!;

    expect(operation.costPerExecution).toEqual({ amount: '0.0026', currency: 'USD' });
    expect(operation.costPaths.map((path) => path.totalCost)).toEqual([
      { amount: '0.042', currency: 'USD' },
      { amount: '0.01', currency: 'USD' },
    ]);
    expect(operation.cost).toEqual({ amount: '0.052', currency: 'USD' });
    expectConsistent(result);
  });

  it('should price one execution but charge nothing when it never runs', () => {
    const result = calculateCreditAllocation([tokenOperation({ runs: 0 })], model);
    const operation = result.operations[0]!;

    expect(operation.costPerExecution).toEqual({ amount: '0.0021', currency: 'USD' });
    expect(operation.cost).toEqual({ amount: '0', currency: 'USD' });
    expect(operation.costPaths[0]?.totalCost).toEqual({ amount: '0', currency: 'USD' });
    expect(operation.credits).toBe(0);
    expect(result.totalCost).toEqual({ amount: '0', currency: 'USD' });
    expect(result.providerCostPerCredit).toBeNull();
    expectConsistent(result);
  });

  it('should still cost money when it is deliberately free of credits', () => {
    const result = calculateCreditAllocation(
      [tokenOperation({ creditsPerExecution: 0 })],
      model,
    );

    expect(result.operations[0]?.cost).toEqual({ amount: '0.105', currency: 'USD' });
    expect(result.operations[0]?.providerCostPerCredit).toBeNull();
    expect(result.totalCredits).toBe(0);
    expect(result.providerCostPerCredit).toBeNull();
    expectConsistent(result);
  });

  it('should divide one execution — not the whole workload — into its credit rate', () => {
    const result = calculateCreditAllocation(
      [tokenOperation({ creditsPerExecution: 7, runs: 123 })],
      model,
    );

    expect(result.operations[0]?.providerCostPerCredit).toEqual({
      amount: '0.0003',
      currency: 'USD',
    });
    expect(result.providerCostPerCredit).toEqual({ amount: '0.0003', currency: 'USD' });
  });

  it('should keep a sub-cent per-run cost exact instead of rounding it away', () => {
    const result = calculateCreditAllocation([micropennyOperation({ runs: 7 })], model);

    expect(result.operations[0]?.cost).toEqual({
      amount: '0.0000000007',
      currency: 'USD',
    });
    expect(result.totalCost).toEqual({ amount: '0.0000000007', currency: 'USD' });
    expectConsistent(result);
  });
});

describe('several features together', () => {
  const workload: CreditAllocationOperation[] = [
    tokenOperation({ runs: 35 }),
    fixedOperation({ runs: 50 }),
    micropennyOperation({ runs: 900 }),
    {
      creditsPerExecution: 12,
      id: 'audit',
      label: 'Compliance audit',
      paths: [
        { inputTokens: 3_333, name: 'Summarise', outputTokens: 777, type: 'tokens' },
        { costPerExecution: 0.000002, name: 'Worker execution', type: 'fixed' },
      ],
      runs: 41,
    },
  ];

  it('should total exactly what its own rows add up to', () => {
    const result = calculateCreditAllocation(workload, model);

    expect(result.operations).toHaveLength(4);
    expect(atomic(result.totalCost)).toBe(
      result.operations.reduce(
        (total, operation) =>
          total + atomic(operation.costPerExecution) * BigInt(operation.runs),
        NOTHING,
      ),
    );
    expectConsistent(result);
  });

  it('should roll up runs, credits, and cost across every feature', () => {
    const result = calculateCreditAllocation(
      [tokenOperation({ runs: 35 }), fixedOperation({ runs: 50 })],
      model,
    );

    expect(result.totalRuns).toBe(85);
    expect(result.totalCredits).toBe(155);
    expect(result.totalCost).toEqual({ amount: '0.0985', currency: 'USD' });
    expectConsistent(result);
  });

  it('should weight the overall credit rate by cost rather than average the rows', () => {
    const result = calculateCreditAllocation(
      [tokenOperation({ runs: 35 }), fixedOperation({ runs: 50 })],
      model,
    );

    // 0.0985 / 155 — not the mean of $0.0007 and $0.0005 per credit.
    expect(result.providerCostPerCredit).toEqual({
      amount: '0.000635483870967741935483870968',
      currency: 'USD',
    });
    expect(result.operations[0]?.providerCostPerCredit).toEqual({
      amount: '0.0007',
      currency: 'USD',
    });
    expect(result.operations[1]?.providerCostPerCredit).toEqual({
      amount: '0.0005',
      currency: 'USD',
    });
  });

  it('should move the grand total by exactly the per-run cost of the feature edited', () => {
    const before = calculateCreditAllocation(workload, model);
    const after = calculateCreditAllocation(
      workload.map((operation) =>
        operation.id === 'insights' ? { ...operation, runs: 36 } : operation,
      ),
      model,
    );

    expect(atomic(after.totalCost) - atomic(before.totalCost)).toBe(
      atomic(before.operations[0]!.costPerExecution),
    );
    expectConsistent(after);
  });

  it('should leave every cost untouched when only credits change', () => {
    const before = calculateCreditAllocation(workload, model);
    const after = calculateCreditAllocation(
      workload.map((operation) => ({
        ...operation,
        creditsPerExecution: operation.creditsPerExecution + 4,
      })),
      model,
    );

    expect(after.totalCost).toEqual(before.totalCost);
    expect(after.operations.map((operation) => operation.cost)).toEqual(
      before.operations.map((operation) => operation.cost),
    );
    expect(after.totalCredits).toBeGreaterThan(before.totalCredits);
    expect(atomic(after.providerCostPerCredit!)).toBeLessThan(
      atomic(before.providerCostPerCredit!),
    );
  });

  it('should let an unused feature sit in the table without changing the total', () => {
    const used = [tokenOperation({ runs: 35 }), fixedOperation({ runs: 50 })];
    const withUnused = calculateCreditAllocation(
      [...used, micropennyOperation({ runs: 0 })],
      model,
    );

    expect(withUnused.totalCost).toEqual(
      calculateCreditAllocation(used, model).totalCost,
    );
    expect(withUnused.operations[2]?.cost).toEqual({ amount: '0', currency: 'USD' });
    expectConsistent(withUnused);
  });

  it('should still bill a feature that charges no credits at all', () => {
    const result = calculateCreditAllocation(
      [
        tokenOperation({ creditsPerExecution: 0, runs: 35 }),
        fixedOperation({ runs: 50 }),
      ],
      model,
    );

    expect(result.totalCost).toEqual({ amount: '0.0985', currency: 'USD' });
    expect(result.totalCredits).toBe(50);
    expect(result.operations[0]?.providerCostPerCredit).toBeNull();
    expect(result.providerCostPerCredit).toEqual({ amount: '0.00197', currency: 'USD' });
    expectConsistent(result);
  });

  it('should total the same workload identically however its features are ordered', () => {
    const forwards = calculateCreditAllocation(workload, model);
    const backwards = calculateCreditAllocation([...workload].reverse(), model);

    expect(backwards.totalCost).toEqual(forwards.totalCost);
    expect(backwards.totalCredits).toBe(forwards.totalCredits);
    expect(backwards.providerCostPerCredit).toEqual(forwards.providerCostPerCredit);
  });

  it('should add up many sub-cent features without losing a fraction of them', () => {
    const operations = Array.from({ length: 25 }, (_, index) =>
      micropennyOperation({ id: `ping-${index}`, label: `Edge ping ${index}`, runs: 40 }),
    );
    const result = calculateCreditAllocation(operations, model);

    // 25 features × 40 runs × $0.0000000001.
    expect(result.totalCost).toEqual({ amount: '0.0000001', currency: 'USD' });
    expectConsistent(result);
  });

  it('should keep the arithmetic exact at the largest quantities it accepts', () => {
    const result = calculateCreditAllocation(
      [
        tokenOperation({ creditsPerExecution: 1_000_000, runs: 1_000_000 }),
        fixedOperation({ creditsPerExecution: 1_000_000, runs: 1_000_000 }),
      ],
      model,
    );

    expect(result.totalCost).toEqual({ amount: '2600', currency: 'USD' });
    expect(result.totalCredits).toBe(2_000_000_000_000);
    expectConsistent(result);
  });
});
