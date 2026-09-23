import type { CreditFeature } from '../src';
import { describe, expect, it } from 'vitest';

import {
  calculateCreditEquivalents,
  calculateCreditUsage,
  calculateSingleFeatureUsage,
} from '../src';

const features: readonly CreditFeature[] = [
  {
    id: 'analysis',
    label: 'AI Analysis',
    description: 'Analyze a document with AI.',
    creditCost: 5,
  },
  { id: 'document', label: 'Document generation', creditCost: 25 },
  { id: 'message', label: 'AI message', creditCost: 1 },
];
const analysisFeature = features[0]!;
const smallCreditBudget = 10;
const twoAnalysisUses = 2;
const focusedCreditBudget = 500;
const focusedAnalysisUses = 50;

describe('calculateCreditUsage', () => {
  it('should calculate totals and per-feature limits in configuration order', () => {
    const result = calculateCreditUsage({
      credits: 500,
      features,
      usage: [
        { featureId: 'analysis', quantity: 30 },
        { featureId: 'document', quantity: 4 },
        { featureId: 'message', quantity: 50 },
      ],
    });

    expect(result).toMatchObject({
      totalCredits: 500,
      usedCredits: 300,
      remainingCredits: 200,
      isWithinBudget: true,
      overBudgetCredits: 0,
    });
    expect(result.features).toEqual([
      expect.objectContaining({
        id: 'analysis',
        quantity: 30,
        usedCredits: 150,
        maxQuantityFromTotal: 100,
        maxQuantityFromRemaining: 40,
      }),
      expect.objectContaining({
        id: 'document',
        quantity: 4,
        usedCredits: 100,
        maxQuantityFromTotal: 20,
        maxQuantityFromRemaining: 8,
      }),
      expect.objectContaining({
        id: 'message',
        quantity: 50,
        usedCredits: 50,
        maxQuantityFromTotal: 500,
        maxQuantityFromRemaining: 200,
      }),
    ]);
    expect(result.equivalents).toEqual([
      expect.objectContaining({ featureId: 'analysis', quantity: 40 }),
      expect.objectContaining({ featureId: 'document', quantity: 8 }),
      expect.objectContaining({ featureId: 'message', quantity: 200 }),
    ]);
  });

  it('should treat omitted feature quantities as zero', () => {
    const result = calculateCreditUsage({
      credits: smallCreditBudget,
      features,
      usage: [{ featureId: 'analysis', quantity: twoAnalysisUses }],
    });

    expect(result.usedCredits).toBe(smallCreditBudget);
    expect(result.features.map((feature) => feature.quantity)).toEqual([
      twoAnalysisUses,
      0,
      0,
    ]);
    expect(result.remainingCredits).toBe(0);
  });

  it('should expose an over-budget state without silently changing quantities', () => {
    const result = calculateCreditUsage({
      credits: 10,
      features,
      usage: [{ featureId: 'document', quantity: 1 }],
    });

    expect(result).toMatchObject({
      usedCredits: 25,
      remainingCredits: 0,
      isWithinBudget: false,
      overBudgetCredits: 15,
    });
    expect(result.features[1]).toMatchObject({ quantity: 1, usedCredits: 25 });
  });

  it('should calculate a focused feature and omit it from remaining equivalents', () => {
    const result = calculateSingleFeatureUsage({
      credits: focusedCreditBudget,
      features,
      featureId: 'analysis',
      quantity: focusedAnalysisUses,
    });

    expect(result.selectedFeature).toMatchObject({ quantity: focusedAnalysisUses });
    expect(result.selectedFeature.usedCredits).toBe(result.remainingCredits);
    expect(result.remainingCredits).toBe(focusedCreditBudget / twoAnalysisUses);
    expect(result.equivalents).toEqual([
      expect.objectContaining({ featureId: 'document', quantity: 10 }),
      expect.objectContaining({ featureId: 'message', quantity: 250 }),
    ]);
  });

  it('should return zero equivalents for a zero balance', () => {
    expect(calculateCreditEquivalents({ credits: 0, features })).toEqual([
      expect.objectContaining({ featureId: 'analysis', quantity: 0 }),
      expect.objectContaining({ featureId: 'document', quantity: 0 }),
      expect.objectContaining({ featureId: 'message', quantity: 0 }),
    ]);
  });

  it('should reject duplicate and unknown feature identifiers', () => {
    expect(() =>
      calculateCreditUsage({
        credits: 10,
        features: [analysisFeature, { ...analysisFeature, label: 'Another analysis' }],
      }),
    ).toThrow(/must be unique/u);

    expect(() =>
      calculateCreditUsage({
        credits: 10,
        features,
        usage: [{ featureId: 'missing', quantity: 1 }],
      }),
    ).toThrow(/Unknown feature id/u);
  });

  it('should reject fractional or negative credits, costs, and quantities', () => {
    expect(() => calculateCreditUsage({ credits: 10.5, features })).toThrow();
    expect(() =>
      calculateCreditUsage({
        credits: 10,
        features: [{ ...analysisFeature, creditCost: 0 }],
      }),
    ).toThrow();
    expect(() =>
      calculateCreditUsage({
        credits: 10,
        features,
        usage: [{ featureId: 'analysis', quantity: -1 }],
      }),
    ).toThrow();
  });
});
