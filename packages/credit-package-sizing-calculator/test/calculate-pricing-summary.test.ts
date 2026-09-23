import type { CreditPricingSummary } from '../src/index.ts';

import { describe, expect, it } from 'vitest';
import { calculatePricingSummary } from '../src/index.ts';

import { INITIAL_ASSUMPTIONS, INITIAL_FEATURES } from './fixtures.ts';

const EXPECTED_MARGIN_PERCENT = 93.59;
const WORST_CASE_MARGIN_PERCENT = 88;
const MARGIN_PRECISION = 1;
const CREDIT_PRECISION = 0;

function summarise(
  overrides: Partial<typeof INITIAL_ASSUMPTIONS> = {},
): CreditPricingSummary {
  return calculatePricingSummary(INITIAL_FEATURES, {
    ...INITIAL_ASSUMPTIONS,
    ...overrides,
  });
}

describe('current package economics', () => {
  const summary = summarise();

  it('should report the expected margin at the usage mix in the table', () => {
    expect(summary.currentPackage.expectedGrossMarginPercent).toBeCloseTo(
      EXPECTED_MARGIN_PERCENT,
      MARGIN_PRECISION,
    );
    expect(summary.currentPackage.expectedMarginStatus).toBe('healthy');
  });

  it('should report the worst-case margin if every credit went to one feature', () => {
    expect(summary.currentPackage.worstCaseGrossMarginPercent).toBeCloseTo(
      WORST_CASE_MARGIN_PERCENT,
      MARGIN_PRECISION,
    );
    expect(summary.currentPackage.worstCaseMarginStatus).toBe('healthy');
  });

  it('should keep the worst case below the expected margin', () => {
    const { expectedGrossMarginPercent, worstCaseGrossMarginPercent } =
      summary.currentPackage;

    expect(worstCaseGrossMarginPercent).toBeLessThan(expectedGrossMarginPercent ?? 0);
  });

  it('should read the package as revenue and profit per credit', () => {
    expect(summary.currentPackage.revenuePerCredit).toEqual({
      amount: '0.01',
      currency: 'USD',
    });
    expect(summary.currentPackage.expectedProfitPerCredit).toEqual({
      amount: '0.009358574',
      currency: 'USD',
    });
    expect(summary.currentPackage.standardActions).toBe(100);
  });

  it('should report a loss as the negative profit it is', () => {
    const loss = summarise({ packagePrice: 0.1 }).currentPackage;

    expect(loss.expectedProfit?.amount.startsWith('-')).toBe(true);
    expect(loss.expectedMarginStatus).toBe('below-target');
  });
});

describe('maximum safe credits', () => {
  const summary = summarise();

  it('should spend only what the target margin leaves for cost of goods', () => {
    expect(summary.limits.allowedCogs).toEqual({ amount: '1', currency: 'USD' });
  });

  it('should hold the worst-case limit below the expected-mix limit', () => {
    expect(summary.limits.worstCaseSafeCredits).toBeCloseTo(694, CREDIT_PRECISION);
    expect(summary.limits.expectedMixSafeCredits).toBeCloseTo(1_299, CREDIT_PRECISION);
  });

  it('should tighten both limits as the safety buffer grows', () => {
    const buffered = summarise({ safetyBufferPercent: 50 }).limits;

    expect(buffered.worstCaseSafeCredits).toBeLessThan(
      summary.limits.worstCaseSafeCredits ?? 0,
    );
    expect(buffered.expectedMixSafeCredits).toBeLessThan(
      summary.limits.expectedMixSafeCredits ?? 0,
    );
  });

  it('should report no limit when the features cost nothing to honour', () => {
    const free = calculatePricingSummary([{ name: 'Free', quantity: 1 }], {
      ...INITIAL_ASSUMPTIONS,
    });

    expect(free.limits.worstCaseSafeCredits).toBeNull();
    expect(free.limits.expectedMixSafeCredits).toBeNull();
  });
});

describe('suggested package', () => {
  it('should leave a comfortable package alone rather than growing it', () => {
    const summary = summarise();

    expect(summary.suggestedPackage.credits).toBe(500);
    expect(summary.suggestedPackage.isCurrentPackageComfortable).toBe(true);
    expect(summary.suggestedPackage.conservativeCredits).toBe(600);
  });

  it('should stop short of the mathematical maximum and round down', () => {
    const summary = summarise({ currentPackageCredits: 5_000 });

    expect(summary.suggestedPackage.credits).toBe(600);
    expect(summary.suggestedPackage.credits % 25).toBe(0);
    expect(summary.suggestedPackage.credits).toBeLessThan(
      summary.limits.worstCaseSafeCredits ?? 0,
    );
  });

  it('should say a package is not comfortable once it passes the limit', () => {
    const summary = summarise({ currentPackageCredits: 5_000 });

    expect(summary.suggestedPackage.isCurrentPackageComfortable).toBe(false);
  });

  it('should honour a different package increment', () => {
    const summary = summarise({
      creditPackageIncrement: 100,
      currentPackageCredits: 5_000,
    });

    expect(summary.suggestedPackage.credits).toBe(600);
  });
});

describe('subscription', () => {
  it('should add the bonus to the suggested package and round it', () => {
    const summary = summarise();

    expect(summary.subscription.credits).toBe(700);
    expect(summary.subscription.bonusPercent).toBe(40);
  });

  it('should warn when the bonus breaks the target margin once buffered', () => {
    const summary = summarise();

    expect(summary.subscription.violatesTargetMargin).toBe(true);
    expect(summary.subscription.economics.bufferedWorstCaseMarginStatus).toBe(
      'below-target',
    );
  });

  it('should stay within target when the bonus is small enough', () => {
    const summary = summarise({ subscriptionCreditBonusPercent: 10 });

    expect(summary.subscription.credits).toBe(550);
    expect(summary.subscription.violatesTargetMargin).toBe(false);
  });

  it('should shrink with the package it is derived from', () => {
    const summary = summarise({ currentPackageCredits: 5_000 });

    expect(summary.subscription.credits).toBe(850);
  });
});

describe('free credit allowance', () => {
  const summary = summarise();

  it('should estimate a month as a year over twelve, not as four weeks', () => {
    expect(summary.freeTier.monthlyCredits).toBeCloseTo(108.33, 2);
  });

  it('should read the weekly allowance as standard AI actions', () => {
    expect(summary.freeTier.standardActionsPerWeek).toBe(5);
  });

  it('should cost the allowance at the weighted average, on its own', () => {
    expect(Number(summary.freeTier.expectedMonthlyCost?.amount)).toBeCloseTo(0.0695, 4);
    expect(summary.currentPackage.expectedCost).not.toEqual(
      summary.freeTier.expectedMonthlyCost,
    );
  });

  it('should report no cost when there is no rate to cost it at', () => {
    const free = calculatePricingSummary([], INITIAL_ASSUMPTIONS);

    expect(free.freeTier.expectedMonthlyCost).toBeNull();
    expect(free.freeTier.monthlyCredits).toBeCloseTo(108.33, 2);
  });
});

describe('scenario comparison', () => {
  const summary = summarise();

  it('should compare the configured package sizes in order', () => {
    expect(summary.scenarios.map((scenario) => scenario.economics.credits)).toEqual([
      500, 700, 1_000,
    ]);
  });

  it('should mark the package currently on sale', () => {
    const current = summary.scenarios.filter((scenario) => scenario.isCurrent);

    expect(current).toHaveLength(1);
    expect(current[0]?.economics.credits).toBe(500);
  });

  it('should show margin falling as the same price buys more credits', () => {
    const margins = summary.scenarios.map(
      (scenario) => scenario.economics.expectedGrossMarginPercent ?? 0,
    );

    expect(margins[0]).toBeGreaterThan(margins[1] ?? 0);
    expect(margins[1]).toBeGreaterThan(margins[2] ?? 0);
  });

  it('should accept custom scenario sizes and drop duplicates', () => {
    const summaryWithCustom = summarise({ scenarioCredits: [1_000, 250, 250] });

    expect(
      summaryWithCustom.scenarios.map((scenario) => scenario.economics.credits),
    ).toEqual([250, 1_000]);
  });
});

describe('empty and invalid input', () => {
  it('should price an empty feature list without inventing a cost', () => {
    const summary = calculatePricingSummary([], INITIAL_ASSUMPTIONS);

    expect(summary.mix.expectedTotalCredits).toBe(0);
    expect(summary.mix.weightedAverageCostPerCredit).toBeNull();
    expect(summary.currentPackage.expectedCost).toBeNull();
    expect(summary.currentPackage.expectedGrossMarginPercent).toBeNull();
    expect(summary.currentPackage.expectedMarginStatus).toBe('unknown');
  });

  it('should report no margin for a package that is given away', () => {
    const summary = summarise({ packagePrice: 0 });

    expect(summary.currentPackage.expectedGrossMarginPercent).toBeNull();
    expect(summary.currentPackage.revenuePerCredit).toEqual({
      amount: '0',
      currency: 'USD',
    });
  });

  it('should report no revenue per credit for a package with no credits', () => {
    const summary = summarise({ currentPackageCredits: 0 });

    expect(summary.currentPackage.revenuePerCredit).toBeNull();
    expect(summary.currentPackage.expectedCost).toEqual({
      amount: '0',
      currency: 'USD',
    });
  });

  it('should reject a feature that charges no credits', () => {
    expect(() =>
      calculatePricingSummary(
        [{ creditsPerExecution: 0, name: 'Free' }],
        INITIAL_ASSUMPTIONS,
      ),
    ).toThrow();
  });

  it('should reject negative tokens, quantities, and fixed costs', () => {
    expect(() =>
      calculatePricingSummary([{ inputTokens: -1, name: 'Bad' }], INITIAL_ASSUMPTIONS),
    ).toThrow();
    expect(() =>
      calculatePricingSummary([{ name: 'Bad', quantity: -1 }], INITIAL_ASSUMPTIONS),
    ).toThrow();
    expect(() =>
      calculatePricingSummary(
        [{ fixedCostPerExecution: -1, name: 'Bad' }],
        INITIAL_ASSUMPTIONS,
      ),
    ).toThrow();
  });

  it('should reject a gross margin no price can satisfy', () => {
    expect(() => summarise({ targetGrossMarginPercent: 100 })).toThrow();
  });

  it('should never report a figure as NaN or Infinity', () => {
    const summary = calculatePricingSummary([], {
      ...INITIAL_ASSUMPTIONS,
      currentPackageCredits: 0,
      packagePrice: 0,
    });
    const numbers = JSON.stringify(summary);

    expect(numbers).not.toContain('NaN');
    expect(numbers).not.toContain('Infinity');
  });
});
