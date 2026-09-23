import { calculateCreditAllocation } from '@pixpilot/credit-allocation-calculator';
import { describe, expect, it } from 'vitest';
import { calculateCreditPricing, createCreditPricingFeatures } from '../src/index.ts';

const model = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

describe('pricing features derived from an allocation', () => {
  it('should carry each operation cost and credit allocation across untouched', () => {
    const allocation = calculateCreditAllocation(
      [
        {
          creditsPerExecution: 5,
          id: 'insights',
          label: 'Job Insights',
          paths: [
            {
              inputTokens: 10_000,
              name: 'AI analysis',
              outputTokens: 1_000,
              type: 'tokens',
            },
          ],
          runs: 50,
        },
        {
          creditsPerExecution: 1,
          id: 'resume-export',
          label: 'Resume Export',
          paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
          runs: 50,
        },
      ],
      model,
    );

    expect(createCreditPricingFeatures(allocation)).toEqual([
      {
        creditsPerExecution: 5,
        id: 'insights',
        label: 'Job Insights',
        providerCostPerExecution: { amount: '0.0021', currency: 'USD' },
      },
      {
        creditsPerExecution: 1,
        id: 'resume-export',
        label: 'Resume Export',
        providerCostPerExecution: { amount: '0.0005', currency: 'USD' },
      },
    ]);
  });

  it('should be priceable without any further conversion', () => {
    const allocation = calculateCreditAllocation(
      [
        {
          creditsPerExecution: 5,
          id: 'insights',
          label: 'Job Insights',
          paths: [{ costPerExecution: 0.002852, name: 'AI analysis', type: 'fixed' }],
          runs: 1,
        },
      ],
      model,
    );

    const result = calculateCreditPricing(createCreditPricingFeatures(allocation), {
      targetGrossMargin: 80,
    });

    expect(result.worstCaseProviderCostPerCredit).toEqual({
      amount: '0.0005704',
      currency: 'USD',
    });
    expect(result.minimumCreditPrice).toEqual({ amount: '0.002852', currency: 'USD' });
  });
});
