import type {
  CreditPackagePricingInput,
  CreditPackagePricingResult,
  CreditPackagePricingSettings,
  FeatureRow,
  PackageRow,
} from '../src/index.ts';

import { describe, expect, it } from 'vitest';
import {
  calculateCreditPackagePricing,
  DEFAULT_CREDIT_PACKAGE_PRICING_SETTINGS,
  DEFAULT_FEATURE_ROWS,
  DEFAULT_PACKAGE_ROWS,
  toMarginStatus,
} from '../src/index.ts';

const PRECISION = 9;
const MARGIN_PRECISION = 4;

const TARGET_MARGIN = 80;
const RAISED_TARGET_MARGIN = 90;
const UNREACHABLE_TARGET_MARGIN = 100;
const DEAR_INPUT_PRICE_PER_MILLION = 2;

/** Job Insights, hand-checked: $0.000002 + 15,000 × $0.20/M + 1,000 × $1.20/M. */
const JOB_INSIGHTS_COST_PER_RUN = 0.004202;
const JOB_INSIGHTS_COST_PER_CREDIT = 0.0008404;
const JOB_INSIGHTS_MONTHLY_COST = 0.4202;
const JOB_INSIGHTS_MONTHLY_CREDITS = 500;
const JOB_INSIGHTS_COST_AT_DEAR_INPUT = 0.031202;

const RESUME_EXPORT_COST_PER_RUN = 0.0005;
const RESUME_EXPORT_COST_PER_CREDIT = 0.00025;

const TWO_FEATURE_TOTAL_COST = 0.4452;
const TWO_FEATURE_TOTAL_CREDITS = 600;
const TWO_FEATURE_BLENDED_COST_PER_CREDIT = 0.000742;

/** One active user's month on the mix the calculator ships with. */
const DEFAULT_MIX_TOTAL_COST = 0.641426;
const DEFAULT_MIX_TOTAL_CREDITS = 1_000;
const DEFAULT_MIX_BLENDED_COST_PER_CREDIT = 0.000641426;
const DEFAULT_MIX_WORST_COST_PER_CREDIT = 0.0012004;

/** The $5 pack against that mix, with and without the processor's cut. */
const FIVE_PACK_PRICE = 5;
const FIVE_PACK_BLENDED_MARGIN = 93.5857;
const FIVE_PACK_WORST_MARGIN = 87.996;
const FIVE_PACK_STRIPE_FEE = 0.445;
const FIVE_PACK_NET_REVENUE = 4.555;
const FIVE_PACK_BLENDED_MARGIN_AFTER_FEE = 84.68574;
const FIVE_PACK_WORST_MARGIN_AFTER_FEE = 79.096;
const FIVE_PACK_SUGGESTED_CREDITS_BLENDED = 1_559;
const FIVE_PACK_SUGGESTED_CREDITS_WORST = 833;
const FIVE_PACK_SUGGESTED_CREDITS_WORST_AT_90 = 416;

const MARGIN_WELL_ABOVE_TARGET = 93.5;
const MARGIN_JUST_UNDER_TARGET = 79.9;
const MARGIN_AT_BAND_EDGE = 70;
const MARGIN_BELOW_BAND = 69.9;

const settings: CreditPackagePricingSettings = DEFAULT_CREDIT_PACKAGE_PRICING_SETTINGS;

const jobInsights: FeatureRow = {
  creditCost: 5,
  fixedCost: 0.000002,
  id: 'job-insights',
  inputTokens: 15_000,
  name: 'AI Job Insights',
  outputTokens: 1_000,
  quantity: 100,
};

const resumeExport: FeatureRow = {
  creditCost: 2,
  fixedCost: 0.0005,
  id: 'resume-export',
  inputTokens: 0,
  name: 'Resume Export',
  outputTokens: 0,
  quantity: 50,
};

const fivePack: PackageRow = { credits: 500, id: 'pack-5', price: 5 };

function calculate(
  overrides: Partial<CreditPackagePricingInput> = {},
): CreditPackagePricingResult {
  return calculateCreditPackagePricing({
    features: [jobInsights],
    packages: [fivePack],
    settings,
    ...overrides,
  });
}

describe('feature costs', () => {
  it('should add the model cost of a run to its fixed cost', () => {
    const [feature] = calculate().features;

    expect(feature?.variableCost).toBeCloseTo(JOB_INSIGHTS_COST_PER_RUN, PRECISION);
  });

  it('should cost a feature that spends no tokens from its fixed cost alone', () => {
    const [feature] = calculate({ features: [resumeExport] }).features;

    expect(feature?.variableCost).toBeCloseTo(RESUME_EXPORT_COST_PER_RUN, PRECISION);
    expect(feature?.costPerCredit).toBeCloseTo(RESUME_EXPORT_COST_PER_CREDIT, PRECISION);
  });

  it('should multiply a run out by the quantity it is expected to run', () => {
    const [feature] = calculate().features;

    expect(feature?.totalCost).toBeCloseTo(JOB_INSIGHTS_MONTHLY_COST, PRECISION);
    expect(feature?.totalCredits).toBe(JOB_INSIGHTS_MONTHLY_CREDITS);
  });

  it('should report no cost per credit for a feature that charges none', () => {
    const [feature] = calculate({
      features: [{ ...jobInsights, creditCost: 0 }],
    }).features;

    expect(feature?.costPerCredit).toBeNull();
  });

  it('should reprice every feature when the model rates change', () => {
    const [feature] = calculate({
      settings: {
        ...settings,
        inputPricePerMillionTokens: DEAR_INPUT_PRICE_PER_MILLION,
      },
    }).features;

    expect(feature?.variableCost).toBeCloseTo(JOB_INSIGHTS_COST_AT_DEAR_INPUT, PRECISION);
  });
});

describe('blended and worst-case cost per credit', () => {
  it('should blend the whole mix rather than average the per-feature rates', () => {
    const result = calculate({ features: [jobInsights, resumeExport] });

    expect(result.totalCost).toBeCloseTo(TWO_FEATURE_TOTAL_COST, PRECISION);
    expect(result.totalCredits).toBe(TWO_FEATURE_TOTAL_CREDITS);
    expect(result.blendedCostPerCredit).toBeCloseTo(
      TWO_FEATURE_BLENDED_COST_PER_CREDIT,
      PRECISION,
    );
  });

  it('should take the worst case from the dearest credit and name its feature', () => {
    const result = calculate({ features: [jobInsights, resumeExport] });

    expect(result.worstCostPerCredit).toBeCloseTo(
      JOB_INSIGHTS_COST_PER_CREDIT,
      PRECISION,
    );
    expect(result.worstFeature?.name).toBe('AI Job Insights');
    expect(result.features.map((feature) => feature.isWorstCase)).toStrictEqual([
      true,
      false,
    ]);
  });

  it('should ignore a feature charging no credits when picking the worst case', () => {
    const result = calculate({
      features: [{ ...jobInsights, creditCost: 0 }, resumeExport],
    });

    expect(result.worstFeature?.name).toBe('Resume Export');
  });

  it('should report no rate at all for a month that issues no credits', () => {
    const result = calculate({ features: [{ ...jobInsights, creditCost: 0 }] });

    expect(result.blendedCostPerCredit).toBeNull();
    expect(result.worstCostPerCredit).toBeNull();
    expect(result.packages[0]?.blendedMargin).toBeNull();
    expect(result.packages[0]?.suggestedCreditsBlended).toBeNull();
  });

  it('should cost the shipped default mix as one active user month', () => {
    const result = calculateCreditPackagePricing({
      features: [...DEFAULT_FEATURE_ROWS],
      packages: [...DEFAULT_PACKAGE_ROWS],
      settings,
    });

    expect(result.totalCredits).toBe(DEFAULT_MIX_TOTAL_CREDITS);
    expect(result.totalCost).toBeCloseTo(DEFAULT_MIX_TOTAL_COST, PRECISION);
    expect(result.blendedCostPerCredit).toBeCloseTo(
      DEFAULT_MIX_BLENDED_COST_PER_CREDIT,
      PRECISION,
    );
    expect(result.worstCostPerCredit).toBeCloseTo(
      DEFAULT_MIX_WORST_COST_PER_CREDIT,
      PRECISION,
    );
    expect(result.worstFeature?.name).toBe('AI Resume Parsing');
  });
});

describe('package economics', () => {
  const defaultMix: Partial<CreditPackagePricingInput> = {
    features: [...DEFAULT_FEATURE_ROWS],
  };

  it('should charge no processor fee while the toggle is off', () => {
    const [pricedPackage] = calculate(defaultMix).packages;

    expect(pricedPackage?.stripeFee).toBe(0);
    expect(pricedPackage?.netRevenue).toBe(FIVE_PACK_PRICE);
    expect(pricedPackage?.blendedMargin).toBeCloseTo(
      FIVE_PACK_BLENDED_MARGIN,
      MARGIN_PRECISION,
    );
    expect(pricedPackage?.worstMargin).toBeCloseTo(
      FIVE_PACK_WORST_MARGIN,
      MARGIN_PRECISION,
    );
  });

  it('should take the processor fee out of revenue before the margin math', () => {
    const [pricedPackage] = calculate({
      ...defaultMix,
      settings: { ...settings, stripeFeesEnabled: true },
    }).packages;

    expect(pricedPackage?.stripeFee).toBeCloseTo(FIVE_PACK_STRIPE_FEE, PRECISION);
    expect(pricedPackage?.netRevenue).toBeCloseTo(FIVE_PACK_NET_REVENUE, PRECISION);
    expect(pricedPackage?.blendedMargin).toBeCloseTo(
      FIVE_PACK_BLENDED_MARGIN_AFTER_FEE,
      MARGIN_PRECISION,
    );
    expect(pricedPackage?.worstMargin).toBeCloseTo(
      FIVE_PACK_WORST_MARGIN_AFTER_FEE,
      MARGIN_PRECISION,
    );
  });

  it('should suggest the credits each price could carry at the target margin', () => {
    const [pricedPackage] = calculate(defaultMix).packages;

    expect(pricedPackage?.suggestedCreditsBlended).toBe(
      FIVE_PACK_SUGGESTED_CREDITS_BLENDED,
    );
    expect(pricedPackage?.suggestedCreditsWorst).toBe(FIVE_PACK_SUGGESTED_CREDITS_WORST);
  });

  it('should suggest fewer credits as the target margin rises', () => {
    const [pricedPackage] = calculate({
      ...defaultMix,
      settings: { ...settings, targetMargin: RAISED_TARGET_MARGIN },
    }).packages;

    expect(pricedPackage?.suggestedCreditsWorst).toBe(
      FIVE_PACK_SUGGESTED_CREDITS_WORST_AT_90,
    );
  });

  it('should suggest no credits at all for a price the fee already exceeds', () => {
    const [pricedPackage] = calculate({
      ...defaultMix,
      packages: [{ credits: 100, id: 'pack-cent', price: 0.1 }],
      settings: { ...settings, stripeFeesEnabled: true },
    }).packages;

    expect(pricedPackage?.suggestedCreditsWorst).toBe(0);
    expect(pricedPackage?.suggestedCreditsBlended).toBe(0);
  });

  it('should report no margin for a package given away', () => {
    const [pricedPackage] = calculate({
      ...defaultMix,
      packages: [{ credits: 100, id: 'free', price: 0 }],
    }).packages;

    expect(pricedPackage?.blendedMargin).toBeNull();
    expect(pricedPackage?.worstMargin).toBeNull();
  });
});

describe('margin status', () => {
  it('should read a margin at or above the target as on target', () => {
    expect(toMarginStatus(TARGET_MARGIN, TARGET_MARGIN)).toBe('on-target');
    expect(toMarginStatus(MARGIN_WELL_ABOVE_TARGET, TARGET_MARGIN)).toBe('on-target');
  });

  it('should read a margin inside the warning band as near the target', () => {
    expect(toMarginStatus(MARGIN_JUST_UNDER_TARGET, TARGET_MARGIN)).toBe('near-target');
    expect(toMarginStatus(MARGIN_AT_BAND_EDGE, TARGET_MARGIN)).toBe('near-target');
  });

  it('should read a margin further below as below the target', () => {
    expect(toMarginStatus(MARGIN_BELOW_BAND, TARGET_MARGIN)).toBe('below-target');
  });

  it('should read an unknown margin as unknown rather than as a failure', () => {
    expect(toMarginStatus(null, TARGET_MARGIN)).toBe('unknown');
  });
});

describe('input validation', () => {
  it('should reject negative token counts rather than price them', () => {
    expect(() =>
      calculate({ features: [{ ...jobInsights, inputTokens: -1 }] }),
    ).toThrow();
  });

  it('should reject a negative quantity', () => {
    expect(() => calculate({ features: [{ ...jobInsights, quantity: -1 }] })).toThrow();
  });

  it('should reject a negative fixed cost', () => {
    expect(() => calculate({ features: [{ ...jobInsights, fixedCost: -1 }] })).toThrow();
  });

  it('should reject a target margin of 100%, which no price can reach', () => {
    expect(() =>
      calculate({ settings: { ...settings, targetMargin: UNREACHABLE_TARGET_MARGIN } }),
    ).toThrow();
  });

  it('should reject two rows sharing an id', () => {
    expect(() => calculate({ features: [jobInsights, jobInsights] })).toThrow();
  });

  it('should price an empty screen without failing', () => {
    const result = calculate({ features: [], packages: [] });

    expect(result.totalCost).toBe(0);
    expect(result.blendedCostPerCredit).toBeNull();
  });
});
