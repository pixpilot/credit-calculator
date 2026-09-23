import { describe, expect, it } from 'vitest';
import { createCreditPricingFeatures } from '../src/index.ts';

import { INITIAL_FEATURES } from './fixtures.ts';

describe('feature identity', () => {
  it('should derive a stable id from the feature name', () => {
    const [feature] = createCreditPricingFeatures([{ name: 'AI Job Insights' }]);

    expect(feature?.id).toBe('ai-job-insights');
  });

  it('should keep an id a caller already supplied', () => {
    const [feature] = createCreditPricingFeatures([
      { id: 'jobInsights', name: 'AI Job Insights' },
    ]);

    expect(feature?.id).toBe('jobInsights');
  });

  it('should be a no-op on rows it produced itself', () => {
    const rows = createCreditPricingFeatures(INITIAL_FEATURES);

    expect(createCreditPricingFeatures(rows)).toEqual(rows);
  });

  it('should keep two features with the same name separately editable', () => {
    const [first, second] = createCreditPricingFeatures([
      { name: 'Resume Export' },
      { name: 'Resume Export' },
    ]);

    expect(first?.id).toBe('resume-export');
    expect(second?.id).toBe('resume-export-2');
  });

  it('should fall back to a usable id for a name with no id characters', () => {
    const [feature] = createCreditPricingFeatures([{ name: '★' }]);

    expect(feature?.id).toBe('feature');
  });
});

describe('feature defaults', () => {
  it('should fill in every figure a scenario list leaves out', () => {
    const [feature] = createCreditPricingFeatures([{ name: 'Bare' }]);

    expect(feature).toEqual({
      creditsPerExecution: 1,
      fixedCostPerExecution: 0,
      id: 'bare',
      inputTokens: 0,
      name: 'Bare',
      outputTokens: 0,
      quantity: 1,
    });
  });

  it('should keep the figures a scenario does supply', () => {
    const [feature] = createCreditPricingFeatures([
      {
        creditsPerExecution: 5,
        fixedCostName: 'Worker execution',
        fixedCostPerExecution: 0.000002,
        inputTokens: 15_000,
        name: 'AI Job Insights',
        outputTokens: 1_000,
        quantity: 100,
      },
    ]);

    expect(feature?.creditsPerExecution).toBe(5);
    expect(feature?.fixedCostName).toBe('Worker execution');
    expect(feature?.quantity).toBe(100);
  });

  it('should reject a feature with no name', () => {
    expect(() => createCreditPricingFeatures([{ name: '  ' }])).toThrow();
  });
});
