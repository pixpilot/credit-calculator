import type { ModelPricing } from '@pixpilot/cost-calculator';

import type {
  CreditAllocationOperation,
  CreditAllocationResult,
  CreditPricingScenario,
} from '../src/index.ts';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  calculateCreditAllocation,
  calculateCreditPricingEconomics,
} from '../src/index.ts';

const model: ModelPricing = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

/** 15k in + 1k out plus a worker call costs exactly $0.002852 per run. */
function insights(
  overrides: Partial<CreditAllocationOperation> = {},
): CreditAllocationOperation {
  return {
    creditsPerExecution: 5,
    id: 'insights',
    label: 'Job Insights',
    paths: [
      { inputTokens: 15_000, name: 'AI analysis', outputTokens: 1_000, type: 'tokens' },
      { costPerExecution: 0.000002, name: 'Worker execution', type: 'fixed' },
    ],
    runs: 35,
    ...overrides,
  };
}

/** A non-AI operation costing exactly $0.0005 per run. */
function resumeExport(
  overrides: Partial<CreditAllocationOperation> = {},
): CreditAllocationOperation {
  return {
    creditsPerExecution: 1,
    id: 'resume-export',
    label: 'Resume Export',
    paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
    runs: 100,
    ...overrides,
  };
}

/** $20 for 10,000 credits: exactly $0.002 of revenue per credit. */
const starterPlan: CreditPricingScenario = {
  id: 'starter',
  includedCredits: 10_000,
  label: 'Starter plan',
  packagePrice: { amount: '20', currency: 'USD' },
};

/** The same $20, plus 2,000 promotional credits: $20 over 12,000 credits. */
const promotionalPlan: CreditPricingScenario = {
  bonusCredits: 2_000,
  id: 'promotional',
  includedCredits: 10_000,
  label: 'Launch promotion',
  packagePrice: { amount: '20', currency: 'USD' },
};

function allocationOf(
  ...operations: CreditAllocationOperation[]
): CreditAllocationResult {
  return calculateCreditAllocation(operations, model);
}

describe('one operation under one pricing scenario', () => {
  it('should derive revenue per credit from the package price and its credits', () => {
    const [scenario] = calculateCreditPricingEconomics(allocationOf(insights()), [
      starterPlan,
    ]).scenarios;

    expect(scenario?.spendableCredits).toBe(10_000);
    expect(scenario?.effectiveRevenuePerCredit).toEqual({
      amount: '0.002',
      currency: 'USD',
    });
  });

  it('should charge the customer for the credits the operation consumes', () => {
    const [scenario] = calculateCreditPricingEconomics(allocationOf(insights()), [
      starterPlan,
    ]).scenarios;
    const operation = scenario?.operations[0];

    // 5 credits at $0.002, against a provider cost of $0.002852 per run.
    expect(operation).toMatchObject({
      creditsPerExecution: 5,
      grossProfitPerExecution: { amount: '0.007148', currency: 'USD' },
      providerCostPerCredit: { amount: '0.0005704', currency: 'USD' },
      providerCostPerExecution: { amount: '0.002852', currency: 'USD' },
      revenuePerExecution: { amount: '0.01', currency: 'USD' },
    });
    expect(operation?.grossMargin).toEqual({ value: '0.7148' });
  });

  it('should total revenue and gross profit across every run', () => {
    const [scenario] = calculateCreditPricingEconomics(allocationOf(insights()), [
      starterPlan,
    ]).scenarios;

    // 35 runs at $0.01 of revenue and $0.002852 of provider cost.
    expect(scenario?.operations[0]).toMatchObject({
      totalProviderCost: { amount: '0.09982', currency: 'USD' },
      totalRevenue: { amount: '0.35', currency: 'USD' },
    });
    expect(scenario?.operations[0]?.totalGrossProfit).toEqual({
      amount: '0.25018',
      currency: 'USD',
    });
    expect(scenario?.totalRevenue).toEqual({ amount: '0.35', currency: 'USD' });
    expect(scenario?.totalGrossProfit).toEqual({ amount: '0.25018', currency: 'USD' });
    expect(scenario?.totalProviderCost).toEqual({ amount: '0.09982', currency: 'USD' });
  });

  it('should roll the whole allocation up into one margin', () => {
    const allocation = allocationOf(insights(), resumeExport());
    const [scenario] = calculateCreditPricingEconomics(allocation, [
      starterPlan,
    ]).scenarios;

    // 275 credits at $0.002 is $0.55, against $0.14982 of provider cost.
    expect(scenario?.totalRevenue).toEqual({ amount: '0.55', currency: 'USD' });
    expect(scenario?.totalGrossProfit).toEqual({ amount: '0.40018', currency: 'USD' });
    expect(scenario?.grossMargin).toEqual({ value: '0.7276' });
  });
});

describe('the credits an operation charges', () => {
  it('should leave the provider execution cost untouched when it doubles', () => {
    const fiveCredits = allocationOf(insights({ creditsPerExecution: 5 }));
    const tenCredits = allocationOf(insights({ creditsPerExecution: 10 }));

    expect(tenCredits.operations[0]?.costPerExecution).toEqual(
      fiveCredits.operations[0]?.costPerExecution,
    );
    expect(tenCredits.totalCost).toEqual(fiveCredits.totalCost);
  });

  it('should halve the provider cost each credit carries when it doubles', () => {
    const fiveCredits = allocationOf(insights({ creditsPerExecution: 5 }));
    const tenCredits = allocationOf(insights({ creditsPerExecution: 10 }));

    expect(fiveCredits.operations[0]?.providerCostPerCredit).toEqual({
      amount: '0.0005704',
      currency: 'USD',
    });
    expect(tenCredits.operations[0]?.providerCostPerCredit).toEqual({
      amount: '0.0002852',
      currency: 'USD',
    });
  });

  it('should double what the customer pays for the same execution', () => {
    const [fiveCredits] = calculateCreditPricingEconomics(
      allocationOf(insights({ creditsPerExecution: 5 })),
      [starterPlan],
    ).scenarios;
    const [tenCredits] = calculateCreditPricingEconomics(
      allocationOf(insights({ creditsPerExecution: 10 })),
      [starterPlan],
    ).scenarios;

    expect(fiveCredits?.operations[0]?.revenuePerExecution).toEqual({
      amount: '0.01',
      currency: 'USD',
    });
    expect(tenCredits?.operations[0]?.revenuePerExecution).toEqual({
      amount: '0.02',
      currency: 'USD',
    });
    expect(tenCredits?.totalRevenue).toEqual({ amount: '0.7', currency: 'USD' });
  });

  it('should widen the gross profit and margin it earns', () => {
    const [fiveCredits] = calculateCreditPricingEconomics(
      allocationOf(insights({ creditsPerExecution: 5 })),
      [starterPlan],
    ).scenarios;
    const [tenCredits] = calculateCreditPricingEconomics(
      allocationOf(insights({ creditsPerExecution: 10 })),
      [starterPlan],
    ).scenarios;

    expect(fiveCredits?.operations[0]?.grossProfitPerExecution).toEqual({
      amount: '0.007148',
      currency: 'USD',
    });
    expect(tenCredits?.operations[0]?.grossProfitPerExecution).toEqual({
      amount: '0.017148',
      currency: 'USD',
    });
    expect(fiveCredits?.operations[0]?.grossMargin).toEqual({ value: '0.7148' });
    expect(tenCredits?.operations[0]?.grossMargin).toEqual({ value: '0.8574' });
  });
});

describe('several pricing scenarios at once', () => {
  it('should price the same operation independently under each of them', () => {
    const { scenarios } = calculateCreditPricingEconomics(allocationOf(insights()), [
      starterPlan,
      promotionalPlan,
    ]);

    expect(scenarios.map((scenario) => scenario.scenario.id)).toEqual([
      'starter',
      'promotional',
    ]);
    expect(scenarios[0]?.operations[0]?.providerCostPerExecution).toEqual(
      scenarios[1]?.operations[0]?.providerCostPerExecution,
    );
    expect(scenarios[0]?.totalProviderCost).toEqual(scenarios[1]?.totalProviderCost);
  });

  it('should earn less per credit once bonus credits are spendable too', () => {
    const { scenarios } = calculateCreditPricingEconomics(allocationOf(insights()), [
      starterPlan,
      promotionalPlan,
    ]);

    expect(scenarios[1]?.spendableCredits).toBe(12_000);
    // $20 over 12,000 credits rather than over 10,000.
    expect(scenarios[1]?.effectiveRevenuePerCredit).toEqual({
      amount: '0.001666666666666666666666666667',
      currency: 'USD',
    });
    expect(scenarios[0]?.operations[0]?.grossMargin).toEqual({ value: '0.7148' });
    expect(scenarios[1]?.operations[0]?.grossMargin).toEqual({
      value: '0.657760000000000000000000000068',
    });
  });

  it('should read a discounted pack as the thinner margin it is', () => {
    const { scenarios } = calculateCreditPricingEconomics(allocationOf(insights()), [
      starterPlan,
      {
        id: 'discounted',
        includedCredits: 10_000,
        label: 'Half-price pack',
        packagePrice: { amount: '10', currency: 'USD' },
      },
    ]);

    expect(scenarios[1]?.effectiveRevenuePerCredit).toEqual({
      amount: '0.001',
      currency: 'USD',
    });
    expect(scenarios[1]?.operations[0]?.revenuePerExecution).toEqual({
      amount: '0.005',
      currency: 'USD',
    });
    expect(scenarios[1]?.operations[0]?.grossMargin).toEqual({ value: '0.4296' });
  });

  it('should reject two scenarios sharing one id', () => {
    expect(() =>
      calculateCreditPricingEconomics(allocationOf(insights()), [
        starterPlan,
        starterPlan,
      ]),
    ).toThrow(/must be unique/u);
  });

  it('should reject a price that is not an exact decimal amount', () => {
    expect(() =>
      calculateCreditPricingEconomics(allocationOf(insights()), [
        { ...starterPlan, packagePrice: { amount: '2e1', currency: 'USD' } },
      ]),
    ).toThrow(ZodError);
  });
});

describe('scenarios and operations that earn nothing', () => {
  it('should charge a free operation nothing while it still costs money to run', () => {
    const [scenario] = calculateCreditPricingEconomics(
      allocationOf(insights({ creditsPerExecution: 0 })),
      [starterPlan],
    ).scenarios;
    const operation = scenario?.operations[0];

    expect(operation?.providerCostPerCredit).toBeNull();
    expect(operation?.revenuePerExecution).toEqual({ amount: '0', currency: 'USD' });
    expect(operation?.grossProfitPerExecution).toEqual({
      amount: '-0.002852',
      currency: 'USD',
    });
    expect(operation?.grossMargin).toBeNull();
    expect(operation?.totalGrossProfit).toEqual({ amount: '-0.09982', currency: 'USD' });
  });

  it('should treat a free plan as a real scenario earning nothing', () => {
    const [scenario] = calculateCreditPricingEconomics(allocationOf(insights()), [
      { ...starterPlan, id: 'free', packagePrice: { amount: '0', currency: 'USD' } },
    ]).scenarios;

    expect(scenario?.effectiveRevenuePerCredit).toEqual({
      amount: '0',
      currency: 'USD',
    });
    expect(scenario?.operations[0]?.revenuePerExecution).toEqual({
      amount: '0',
      currency: 'USD',
    });
    expect(scenario?.operations[0]?.grossMargin).toBeNull();
    expect(scenario?.totalRevenue).toEqual({ amount: '0', currency: 'USD' });
    expect(scenario?.totalGrossProfit).toEqual({ amount: '-0.09982', currency: 'USD' });
    expect(scenario?.grossMargin).toBeNull();
  });

  it('should refuse to divide a price by no spendable credits at all', () => {
    const [scenario] = calculateCreditPricingEconomics(allocationOf(insights()), [
      { ...starterPlan, id: 'empty', includedCredits: 0 },
    ]).scenarios;

    expect(scenario?.spendableCredits).toBe(0);
    expect(scenario?.effectiveRevenuePerCredit).toBeNull();
    expect(scenario?.operations[0]?.revenuePerExecution).toBeNull();
    expect(scenario?.operations[0]?.grossProfitPerExecution).toBeNull();
    expect(scenario?.operations[0]?.grossMargin).toBeNull();
    expect(scenario?.totalRevenue).toBeNull();
    expect(scenario?.totalGrossProfit).toBeNull();
    expect(scenario?.grossMargin).toBeNull();
    expect(scenario?.totalProviderCost).toEqual({ amount: '0.09982', currency: 'USD' });
  });

  it('should earn nothing from an operation nobody runs, and still price one run', () => {
    const [scenario] = calculateCreditPricingEconomics(
      allocationOf(insights({ runs: 0 })),
      [starterPlan],
    ).scenarios;
    const operation = scenario?.operations[0];

    expect(operation?.revenuePerExecution).toEqual({ amount: '0.01', currency: 'USD' });
    expect(operation?.grossMargin).toEqual({ value: '0.7148' });
    expect(operation?.totalRevenue).toEqual({ amount: '0', currency: 'USD' });
    expect(operation?.totalGrossProfit).toEqual({ amount: '0', currency: 'USD' });
    expect(scenario?.grossMargin).toBeNull();
  });

  it('should report a loss when the provider costs more than the credits earn', () => {
    const [scenario] = calculateCreditPricingEconomics(
      allocationOf(insights({ creditsPerExecution: 1 })),
      [starterPlan],
    ).scenarios;
    const operation = scenario?.operations[0];

    // $0.002 of revenue against $0.002852 of provider cost.
    expect(operation?.grossProfitPerExecution).toEqual({
      amount: '-0.000852',
      currency: 'USD',
    });
    expect(operation?.grossMargin).toEqual({ value: '-0.426' });
    expect(operation?.totalGrossProfit).toEqual({ amount: '-0.02982', currency: 'USD' });
    expect(scenario?.grossMargin).toEqual({ value: '-0.426' });
  });

  it('should produce no economics at all when no scenario applies', () => {
    const { scenarios } = calculateCreditPricingEconomics(allocationOf(insights()), []);

    expect(scenarios).toEqual([]);
  });
});
