import { describe, expect, it } from 'vitest';

import { calculateCreditAllocation } from '../src/index.ts';

describe('two-feature allocation example', () => {
  it('should show each feature cost breakdown and the combined allocation totals', () => {
    const model = {
      inputPricePerMillionTokens: 0.15,
      outputPricePerMillionTokens: 0.6,
    };

    const result = calculateCreditAllocation(
      [
        {
          creditsPerExecution: 5,
          id: 'insights',
          label: 'Job Insights',
          paths: [
            {
              inputTokens: 15_000,
              name: 'AI analysis',
              outputTokens: 1_000,
              type: 'tokens',
            },
            { costPerExecution: 0.000002, name: 'Worker execution', type: 'fixed' },
          ],
          runs: 35,
        },
        {
          creditsPerExecution: 1,
          id: 'resume-export',
          label: 'Resume Export',
          paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
          runs: 100,
        },
      ],
      model,
    );

    expect(result.operations).toMatchObject([
      {
        cost: { amount: '0.09982', currency: 'USD' },
        costPaths: [
          {
            costPerExecution: { amount: '0.00285', currency: 'USD' },
            inputCost: { amount: '0.00225', currency: 'USD' },
            inputTokens: 15_000,
            name: 'AI analysis',
            outputCost: { amount: '0.0006', currency: 'USD' },
            outputTokens: 1_000,
            totalCost: { amount: '0.09975', currency: 'USD' },
            type: 'tokens',
          },
          {
            costPerExecution: { amount: '0.000002', currency: 'USD' },
            name: 'Worker execution',
            totalCost: { amount: '0.00007', currency: 'USD' },
            type: 'fixed',
          },
        ],
        providerCostPerCredit: { amount: '0.0005704', currency: 'USD' },
        costPerExecution: { amount: '0.002852', currency: 'USD' },
        credits: 175,
        creditsPerExecution: 5,
        id: 'insights',
        label: 'Job Insights',
        runs: 35,
      },
      {
        cost: { amount: '0.05', currency: 'USD' },
        costPaths: [
          {
            costPerExecution: { amount: '0.0005', currency: 'USD' },
            name: 'PDF rendering',
            totalCost: { amount: '0.05', currency: 'USD' },
            type: 'fixed',
          },
        ],
        providerCostPerCredit: { amount: '0.0005', currency: 'USD' },
        costPerExecution: { amount: '0.0005', currency: 'USD' },
        credits: 100,
        creditsPerExecution: 1,
        id: 'resume-export',
        label: 'Resume Export',
        runs: 100,
      },
    ]);
    expect(result).toMatchObject({
      providerCostPerCredit: { amount: '0.0005448', currency: 'USD' },
      totalCost: { amount: '0.14982', currency: 'USD' },
      totalCredits: 275,
      totalRuns: 135,
    });
  });
});
