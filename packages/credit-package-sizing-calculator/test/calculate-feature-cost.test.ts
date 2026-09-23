import type { CalculatedCreditPricingFeature, CreditUsageMix } from '../src/index.ts';

import { describe, expect, it } from 'vitest';
import { calculateCreditUsageMix, createCreditPricingFeatures } from '../src/index.ts';

import { INITIAL_ASSUMPTIONS, INITIAL_FEATURES } from './fixtures.ts';

const NO_BUFFER = 0;
const BUFFER_PERCENT = 20;
const FRACTIONAL_BUFFER_PERCENT = 12.5;

const TOKEN_PRICING = {
  inputCostPerMillionTokens: 0.2,
  outputCostPerMillionTokens: 1.2,
};

function mixOf(
  features: Parameters<typeof createCreditPricingFeatures>[0],
  safetyBufferPercent = NO_BUFFER,
): CreditUsageMix {
  return calculateCreditUsageMix(createCreditPricingFeatures(features), {
    ...TOKEN_PRICING,
    safetyBufferPercent,
  });
}

function featureById(mix: CreditUsageMix, id: string): CalculatedCreditPricingFeature {
  const feature = mix.features.find((candidate) => candidate.id === id);

  if (feature == null) throw new Error(`No calculated feature "${id}"`);

  return feature;
}

describe('token cost', () => {
  it('should price prompt and completion tokens at their own rates', () => {
    const feature = featureById(
      mixOf([{ inputTokens: 15_000, name: 'Insights', outputTokens: 1_000 }]),
      'insights',
    );

    expect(feature.inputCostPerExecution).toEqual({ amount: '0.003', currency: 'USD' });
    expect(feature.outputCostPerExecution).toEqual({ amount: '0.0012', currency: 'USD' });
  });

  it('should keep a sub-cent token cost exact rather than rounding it away', () => {
    const feature = featureById(
      mixOf([{ inputTokens: 1, name: 'Tiny', outputTokens: 0 }]),
      'tiny',
    );

    expect(feature.costPerExecution).toEqual({ amount: '0.0000002', currency: 'USD' });
  });

  it('should charge nothing for a feature that spends no tokens', () => {
    const feature = featureById(mixOf([{ name: 'Free of tokens' }]), 'free-of-tokens');

    expect(feature.costPerExecution).toEqual({ amount: '0', currency: 'USD' });
  });
});

describe('fixed-cost-only feature', () => {
  it('should cost exactly its fixed cost when it spends no tokens', () => {
    const feature = featureById(
      mixOf([
        {
          creditsPerExecution: 2,
          fixedCostName: 'PDF rendering',
          fixedCostPerExecution: 0.0005,
          name: 'Resume Export',
        },
      ]),
      'resume-export',
    );

    expect(feature.costPerExecution).toEqual({ amount: '0.0005', currency: 'USD' });
    expect(feature.costPerCredit).toEqual({ amount: '0.00025', currency: 'USD' });
  });
});

describe('cost per credit', () => {
  it('should spread an execution cost across the credits it charges', () => {
    const feature = featureById(
      mixOf([
        {
          creditsPerExecution: 5,
          fixedCostPerExecution: 0.000002,
          inputTokens: 15_000,
          name: 'AI Job Insights',
          outputTokens: 1_000,
        },
      ]),
      'ai-job-insights',
    );

    expect(feature.costPerExecution).toEqual({ amount: '0.004202', currency: 'USD' });
    expect(feature.costPerCredit).toEqual({ amount: '0.0008404', currency: 'USD' });
    expect(feature.totalCredits).toBe(5);
  });

  it('should leave a one-credit execution cost unchanged', () => {
    const feature = featureById(
      mixOf([{ creditsPerExecution: 1, fixedCostPerExecution: 0.0005, name: 'Export' }]),
      'export',
    );

    expect(feature.costPerCredit).toEqual({ amount: '0.0005', currency: 'USD' });
  });
});

describe('weighted average cost per credit', () => {
  it('should divide the total cost by the total credits, not average the rates', () => {
    const mix = mixOf([
      { creditsPerExecution: 1, fixedCostPerExecution: 1, name: 'Rare', quantity: 1 },
      {
        creditsPerExecution: 1,
        fixedCostPerExecution: 0.1,
        name: 'Common',
        quantity: 9,
      },
    ]);

    // $1.90 over 10 credits, not the $0.55 mean of the two per-credit rates.
    expect(mix.weightedAverageCostPerCredit).toEqual({
      amount: '0.19',
      currency: 'USD',
    });
  });

  it('should report no average when the features charge no credits at all', () => {
    const mix = mixOf([{ fixedCostPerExecution: 1, name: 'Never run', quantity: 0 }]);

    expect(mix.expectedTotalCredits).toBe(0);
    expect(mix.weightedAverageCostPerCredit).toBeNull();
  });
});

describe('worst-case cost per credit', () => {
  it('should take the least efficient feature, whatever its expected usage', () => {
    const mix = mixOf([
      {
        creditsPerExecution: 1,
        fixedCostPerExecution: 0.001,
        name: 'Cheap',
        quantity: 1_000,
      },
      {
        creditsPerExecution: 1,
        fixedCostPerExecution: 0.05,
        name: 'Expensive',
        quantity: 1,
      },
    ]);

    expect(mix.worstCaseCostPerCredit).toEqual({ amount: '0.05', currency: 'USD' });
    expect(mix.worstCaseFeatureId).toBe('expensive');
    expect(featureById(mix, 'expensive').isWorstCase).toBe(true);
    expect(featureById(mix, 'cheap').isWorstCase).toBe(false);
  });

  it('should keep the earlier feature when two are equally expensive', () => {
    const mix = mixOf([
      { creditsPerExecution: 1, fixedCostPerExecution: 0.01, name: 'First' },
      { creditsPerExecution: 1, fixedCostPerExecution: 0.01, name: 'Second' },
    ]);

    expect(mix.worstCaseFeatureId).toBe('first');
  });

  it('should report no worst case when there are no features', () => {
    const mix = mixOf([]);

    expect(mix.worstCaseCostPerCredit).toBeNull();
    expect(mix.worstCaseFeatureId).toBeNull();
    expect(mix.expectedTotalCost).toEqual({ amount: '0', currency: 'USD' });
  });
});

describe('safety buffer', () => {
  it('should raise the assumed cost rather than the assumed revenue', () => {
    const mix = mixOf(
      [{ creditsPerExecution: 1, fixedCostPerExecution: 0.001, name: 'Export' }],
      BUFFER_PERCENT,
    );

    expect(mix.worstCaseCostPerCredit).toEqual({ amount: '0.001', currency: 'USD' });
    expect(mix.bufferedWorstCaseCostPerCredit).toEqual({
      amount: '0.0012',
      currency: 'USD',
    });
    expect(mix.bufferedWeightedAverageCostPerCredit).toEqual({
      amount: '0.0012',
      currency: 'USD',
    });
  });

  it('should leave the cost untouched when there is no buffer', () => {
    const mix = mixOf([
      { creditsPerExecution: 1, fixedCostPerExecution: 0.001, name: 'Export' },
    ]);

    expect(mix.bufferedWorstCaseCostPerCredit).toEqual(mix.worstCaseCostPerCredit);
  });

  it('should apply a fractional buffer exactly', () => {
    const mix = mixOf(
      [{ creditsPerExecution: 1, fixedCostPerExecution: 0.001, name: 'Export' }],
      FRACTIONAL_BUFFER_PERCENT,
    );

    expect(mix.bufferedWorstCaseCostPerCredit).toEqual({
      amount: '0.001125',
      currency: 'USD',
    });
  });
});

describe('the initial dataset', () => {
  const mix = mixOf(INITIAL_FEATURES, INITIAL_ASSUMPTIONS.safetyBufferPercent);

  it('should total the credits and the direct cost the strategy was sized on', () => {
    expect(mix.expectedTotalCredits).toBe(1_000);
    expect(Number(mix.expectedTotalCost.amount)).toBeCloseTo(0.6414, 4);
  });

  it('should cost AI Job Insights exactly as the pricing model does', () => {
    const feature = featureById(mix, 'ai-job-insights');

    expect(feature.costPerExecution).toEqual({ amount: '0.004202', currency: 'USD' });
    expect(feature.costPerCredit).toEqual({ amount: '0.0008404', currency: 'USD' });
    expect(feature.totalCost).toEqual({ amount: '0.4202', currency: 'USD' });
    expect(feature.totalCredits).toBe(500);
  });

  it('should name resume parsing as the least efficient feature', () => {
    expect(mix.worstCaseFeatureId).toBe('ai-resume-parsing');
    expect(mix.worstCaseCostPerCredit).toEqual({ amount: '0.0012004', currency: 'USD' });
  });
});
