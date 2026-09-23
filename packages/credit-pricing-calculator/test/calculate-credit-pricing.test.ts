import type {
  CalculatedCreditPricingFeature,
  CreditPricingFeature,
} from '../src/index.ts';

import { describe, expect, it } from 'vitest';
import { calculateCreditPricing } from '../src/index.ts';

const TARGET_GROSS_MARGIN = 80;
const FRACTIONAL_GROSS_MARGIN = 82.5;
const FRACTIONAL_SAFETY_BUFFER = 12.5;

const jobInsights: CreditPricingFeature = {
  creditsPerExecution: 5,
  id: 'insights',
  label: 'Job Insights',
  providerCostPerExecution: 0.002852,
};

const resumeExport: CreditPricingFeature = {
  creditsPerExecution: 1,
  id: 'resume-export',
  label: 'Resume Export',
  providerCostPerExecution: 0.0005,
};

const features = [jobInsights, resumeExport];

function featureById(
  result: { features: CalculatedCreditPricingFeature[] },
  id: string,
): CalculatedCreditPricingFeature {
  const feature = result.features.find((candidate) => candidate.id === id);

  if (feature == null) throw new Error(`No calculated feature "${id}"`);

  return feature;
}

describe('provider cost per credit', () => {
  it('should spread an execution cost across the credits it charges', () => {
    const result = calculateCreditPricing(features, {
      targetGrossMargin: TARGET_GROSS_MARGIN,
    });

    expect(featureById(result, 'insights').providerCostPerCredit).toEqual({
      amount: '0.0005704',
      currency: 'USD',
    });
  });

  it('should leave a one-credit execution cost unchanged', () => {
    const result = calculateCreditPricing(features, {
      targetGrossMargin: TARGET_GROSS_MARGIN,
    });

    expect(featureById(result, 'resume-export').providerCostPerCredit).toEqual({
      amount: '0.0005',
      currency: 'USD',
    });
  });

  it('should read an exact amount as readily as a number', () => {
    const result = calculateCreditPricing(
      [
        {
          ...jobInsights,
          providerCostPerExecution: { amount: '0.002852', currency: 'USD' },
        },
      ],
      { targetGrossMargin: TARGET_GROSS_MARGIN },
    );

    expect(featureById(result, 'insights').providerCostPerCredit).toEqual({
      amount: '0.0005704',
      currency: 'USD',
    });
  });

  it('should read a cost small enough to print in exponent notation', () => {
    const result = calculateCreditPricing(
      [{ ...resumeExport, providerCostPerExecution: 0.0000005 }],
      { targetGrossMargin: TARGET_GROSS_MARGIN },
    );

    expect(featureById(result, 'resume-export').providerCostPerCredit).toEqual({
      amount: '0.0000005',
      currency: 'USD',
    });
  });
});

describe('the worst-case feature', () => {
  it('should be the most expensive credit rather than the average one', () => {
    const result = calculateCreditPricing(features, {
      targetGrossMargin: TARGET_GROSS_MARGIN,
    });

    expect(result.worstCaseProviderCostPerCredit).toEqual({
      amount: '0.0005704',
      currency: 'USD',
    });
    expect(result.worstCaseFeatureId).toBe('insights');
    expect(featureById(result, 'insights').isPriceSetting).toBe(true);
    expect(featureById(result, 'resume-export').isPriceSetting).toBe(false);
  });

  it('should be found regardless of the order the features are listed in', () => {
    const reversed = calculateCreditPricing([resumeExport, jobInsights], {
      targetGrossMargin: TARGET_GROSS_MARGIN,
    });

    expect(reversed.worstCaseFeatureId).toBe('insights');
    expect(reversed.worstCaseProviderCostPerCredit).toEqual({
      amount: '0.0005704',
      currency: 'USD',
    });
  });

  it('should ignore a feature that charges no credits', () => {
    const result = calculateCreditPricing(
      [{ ...jobInsights, creditsPerExecution: 0 }, resumeExport],
      { targetGrossMargin: TARGET_GROSS_MARGIN },
    );

    expect(featureById(result, 'insights').providerCostPerCredit).toBeNull();
    expect(result.worstCaseFeatureId).toBe('resume-export');
    expect(result.worstCaseProviderCostPerCredit).toEqual({
      amount: '0.0005',
      currency: 'USD',
    });
  });

  it('should ignore a feature that is switched off', () => {
    const result = calculateCreditPricing(
      [{ ...jobInsights, enabled: false }, resumeExport],
      { targetGrossMargin: TARGET_GROSS_MARGIN },
    );

    expect(featureById(result, 'insights').providerCostPerCredit).toEqual({
      amount: '0.0005704',
      currency: 'USD',
    });
    expect(result.worstCaseFeatureId).toBe('resume-export');
  });
});

describe('the minimum credit price', () => {
  it('should reach the target gross margin against the worst-case cost', () => {
    const result = calculateCreditPricing(features, {
      targetGrossMargin: TARGET_GROSS_MARGIN,
    });

    expect(result.minimumCreditPrice).toEqual({ amount: '0.002852', currency: 'USD' });
    expect(featureById(result, 'insights').marginAtCalculatedCreditPrice).toBe(
      TARGET_GROSS_MARGIN,
    );
  });

  it('should equal the worst-case cost when no margin is asked for', () => {
    const result = calculateCreditPricing(features, { targetGrossMargin: 0 });

    expect(result.minimumCreditPrice).toEqual({ amount: '0.0005704', currency: 'USD' });
    expect(featureById(result, 'insights').marginAtCalculatedCreditPrice).toBe(0);
  });

  it('should fall when the same execution cost is spread over more credits', () => {
    const result = calculateCreditPricing(
      [{ ...jobInsights, creditsPerExecution: 10 }, resumeExport],
      { targetGrossMargin: TARGET_GROSS_MARGIN },
    );
    const insights = featureById(result, 'insights');

    expect(insights.providerCostPerExecution).toEqual({
      amount: '0.002852',
      currency: 'USD',
    });
    expect(insights.providerCostPerCredit).toEqual({
      amount: '0.0002852',
      currency: 'USD',
    });
    expect(result.worstCaseFeatureId).toBe('resume-export');
    expect(result.minimumCreditPrice).toEqual({ amount: '0.0025', currency: 'USD' });
  });

  it('should rise with a safety buffer on the provider cost', () => {
    const result = calculateCreditPricing(features, {
      safetyBuffer: 20,
      targetGrossMargin: TARGET_GROSS_MARGIN,
    });

    expect(result.bufferedProviderCostPerCredit).toEqual({
      amount: '0.00068448',
      currency: 'USD',
    });
    expect(result.minimumCreditPrice).toEqual({ amount: '0.0034224', currency: 'USD' });
  });

  it('should report the fractional settings it was calculated with', () => {
    const result = calculateCreditPricing(features, {
      safetyBuffer: FRACTIONAL_SAFETY_BUFFER,
      targetGrossMargin: FRACTIONAL_GROSS_MARGIN,
    });

    expect(result.targetGrossMargin).toBe(FRACTIONAL_GROSS_MARGIN);
    expect(result.safetyBuffer).toBe(FRACTIONAL_SAFETY_BUFFER);
    expect(result.bufferedProviderCostPerCredit).toEqual({
      amount: '0.0006417',
      currency: 'USD',
    });
  });

  it('should leave the buffer as headroom above the target margin', () => {
    const buffered = calculateCreditPricing(features, {
      safetyBuffer: FRACTIONAL_SAFETY_BUFFER,
      targetGrossMargin: FRACTIONAL_GROSS_MARGIN,
    });
    const unbuffered = calculateCreditPricing(features, {
      targetGrossMargin: FRACTIONAL_GROSS_MARGIN,
    });

    expect(featureById(unbuffered, 'insights').marginAtCalculatedCreditPrice).toBe(
      FRACTIONAL_GROSS_MARGIN,
    );
    expect(
      featureById(buffered, 'insights').marginAtCalculatedCreditPrice,
    ).toBeGreaterThan(FRACTIONAL_GROSS_MARGIN);
  });
});

describe('features that charge nothing', () => {
  it('should price nothing at all when no feature charges a credit', () => {
    const result = calculateCreditPricing(
      [
        { ...jobInsights, creditsPerExecution: 0 },
        { ...resumeExport, creditsPerExecution: 0 },
      ],
      { targetGrossMargin: TARGET_GROSS_MARGIN },
    );

    expect(result.worstCaseProviderCostPerCredit).toBeNull();
    expect(result.worstCaseFeatureId).toBeNull();
    expect(result.bufferedProviderCostPerCredit).toBeNull();
    expect(result.minimumCreditPrice).toBeNull();
    expect(result.recommendedCreditPrice).toBeNull();
    expect(
      result.features.every((feature) => feature.marginAtCalculatedCreditPrice === null),
    ).toBe(true);
  });

  it('should never answer with a non-finite figure', () => {
    const result = calculateCreditPricing(
      [{ ...jobInsights, providerCostPerExecution: 0 }],
      { safetyBuffer: 50, targetGrossMargin: 99 },
    );

    expect(result.minimumCreditPrice).toEqual({ amount: '0', currency: 'USD' });
    expect(featureById(result, 'insights').marginAtCalculatedCreditPrice).toBeNull();
  });
});

describe('the recommended credit price', () => {
  it('should be left out until a rounding is asked for', () => {
    const result = calculateCreditPricing(features, {
      targetGrossMargin: TARGET_GROSS_MARGIN,
    });

    expect(result.recommendedCreditPrice).toBeNull();
  });

  it('should round up to a cleaner figure, never below the minimum', () => {
    const result = calculateCreditPricing(features, {
      roundUpToDecimalPlaces: 3,
      targetGrossMargin: TARGET_GROSS_MARGIN,
    });

    expect(result.minimumCreditPrice).toEqual({ amount: '0.002852', currency: 'USD' });
    expect(result.recommendedCreditPrice).toEqual({ amount: '0.003', currency: 'USD' });
  });

  it('should be the price the features are measured against', () => {
    const result = calculateCreditPricing(features, {
      roundUpToDecimalPlaces: 3,
      targetGrossMargin: TARGET_GROSS_MARGIN,
    });

    expect(featureById(result, 'insights').marginAtCalculatedCreditPrice).toBeGreaterThan(
      TARGET_GROSS_MARGIN,
    );
  });

  it('should leave an already clean minimum where it is', () => {
    const result = calculateCreditPricing(
      [{ ...resumeExport, providerCostPerExecution: 0.001 }],
      { roundUpToDecimalPlaces: 3, targetGrossMargin: 0 },
    );

    expect(result.recommendedCreditPrice).toEqual({ amount: '0.001', currency: 'USD' });
  });
});

describe('rejected input', () => {
  it('should reject a gross margin of 100%, which no price satisfies', () => {
    expect(() => calculateCreditPricing(features, { targetGrossMargin: 100 })).toThrow();
  });

  it('should reject a gross margin above 100%', () => {
    expect(() => calculateCreditPricing(features, { targetGrossMargin: 120 })).toThrow();
  });

  it('should reject a negative gross margin', () => {
    expect(() => calculateCreditPricing(features, { targetGrossMargin: -1 })).toThrow();
  });

  it('should reject a negative safety buffer', () => {
    expect(() =>
      calculateCreditPricing(features, {
        safetyBuffer: -10,
        targetGrossMargin: TARGET_GROSS_MARGIN,
      }),
    ).toThrow();
  });

  it('should reject a negative provider cost', () => {
    expect(() =>
      calculateCreditPricing([{ ...jobInsights, providerCostPerExecution: -0.01 }], {
        targetGrossMargin: TARGET_GROSS_MARGIN,
      }),
    ).toThrow();
  });

  it('should reject a fractional credit allocation', () => {
    expect(() =>
      calculateCreditPricing([{ ...jobInsights, creditsPerExecution: 1.5 }], {
        targetGrossMargin: TARGET_GROSS_MARGIN,
      }),
    ).toThrow();
  });

  it('should reject a negative credit allocation', () => {
    expect(() =>
      calculateCreditPricing([{ ...jobInsights, creditsPerExecution: -1 }], {
        targetGrossMargin: TARGET_GROSS_MARGIN,
      }),
    ).toThrow();
  });

  it('should reject two features sharing an id', () => {
    expect(() =>
      calculateCreditPricing([jobInsights, { ...resumeExport, id: 'insights' }], {
        targetGrossMargin: TARGET_GROSS_MARGIN,
      }),
    ).toThrow(/must be unique/u);
  });
});
