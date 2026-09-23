import type { CreditPackageFeatureScenario } from '../src/index.ts';

import { describe, expect, it } from 'vitest';
import { createFeatureRows, DEFAULT_FEATURE_SCENARIOS } from '../src/index.ts';

describe('createFeatureRows', () => {
  it('should carry a fully described scenario across untouched', () => {
    const scenarios: CreditPackageFeatureScenario[] = [
      {
        creditsPerExecution: 5,
        fixedCostPerExecution: 0.000002,
        inputTokens: 15_000,
        name: 'AI Job Insights',
        outputTokens: 1_000,
        quantity: 100,
      },
    ];

    expect(createFeatureRows(scenarios)).toStrictEqual([
      {
        creditCost: 5,
        fixedCost: 0.000002,
        id: 'ai-job-insights',
        inputTokens: 15_000,
        name: 'AI Job Insights',
        outputTokens: 1_000,
        quantity: 100,
      },
    ]);
  });

  it('should cost an omitted estimate as nothing and an omitted quantity as one run', () => {
    expect(createFeatureRows([{ name: 'Resume Export' }])).toStrictEqual([
      {
        creditCost: 0,
        fixedCost: 0,
        id: 'resume-export',
        inputTokens: 0,
        name: 'Resume Export',
        outputTokens: 0,
        quantity: 1,
      },
    ]);
  });

  it('should keep rows apart when two features share a name', () => {
    const rows = createFeatureRows([{ name: 'Export' }, { name: 'Export' }]);

    expect(rows.map((row) => row.id)).toStrictEqual(['export', 'export-2']);
  });

  it('should still identify a feature named in punctuation alone', () => {
    expect(createFeatureRows([{ name: '***' }])[0]?.id).toBe('feature');
  });

  it('should seed a row for every feature the calculator ships with', () => {
    expect(createFeatureRows(DEFAULT_FEATURE_SCENARIOS)).toHaveLength(
      DEFAULT_FEATURE_SCENARIOS.length,
    );
  });
});
