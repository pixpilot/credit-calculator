'use client';

import type {
  CreditPricingAssumptionsInput,
  CreditPricingFeature,
  CreditPricingFeatureInput,
  CreditPricingSummary,
} from '@pixpilot/credit-package-sizing-calculator';

import {
  calculatePricingSummary,
  createCreditPricingFeatures,
} from '@pixpilot/credit-package-sizing-calculator';
import { useMemo } from 'react';

import { useCreditPricingValue } from './use-credit-pricing-value.ts';

/** The name a feature added from the table starts out with. */
const NEW_FEATURE_NAME = 'New feature';

export interface UseCreditPricingCalculatorOptions {
  assumptions?: CreditPricingAssumptionsInput | undefined;
  defaultAssumptions: CreditPricingAssumptionsInput;
  defaultValue: readonly CreditPricingFeatureInput[];
  onAssumptionsChange?:
    ((assumptions: CreditPricingAssumptionsInput) => void) | undefined;
  onChange?: ((features: CreditPricingFeature[]) => void) | undefined;
  value?: readonly CreditPricingFeatureInput[] | undefined;
}

export interface CreditPricingCalculatorState {
  addFeature: () => void;
  assumptions: CreditPricingAssumptionsInput;
  features: CreditPricingFeature[];
  removeFeature: (featureId: string) => void;
  summary: CreditPricingSummary;
  updateAssumptions: (changes: Partial<CreditPricingAssumptionsInput>) => void;
  updateFeature: (featureId: string, changes: Partial<CreditPricingFeature>) => void;
}

/**
 * Holds the two things an administrator edits, and recalculates everything
 * from them on every keystroke.
 *
 * Features are normalised on the way in, so a host may hand over the scenario
 * list it already keeps — a name and whatever estimates it has — and still get
 * rows with the stable ids the table edits against. Normalising is idempotent,
 * so a controlled host passing back what `onChange` gave it changes nothing,
 * and `onChange` always reports normalised rows rather than the looser shape
 * it may have been given.
 *
 * The summary is derived rather than stored. There is no second copy of a
 * margin to fall out of step with the inputs that produced it, and no effect
 * to run before the screen agrees with itself.
 */
export function useCreditPricingCalculator({
  assumptions: controlledAssumptions,
  defaultAssumptions,
  defaultValue,
  onAssumptionsChange,
  onChange,
  value: controlledValue,
}: UseCreditPricingCalculatorOptions): CreditPricingCalculatorState {
  const { update: updateValue, value } = useCreditPricingValue<
    readonly CreditPricingFeatureInput[]
  >({ defaultValue, value: controlledValue });
  const { update: updateAssumptionsValue, value: assumptions } =
    useCreditPricingValue<CreditPricingAssumptionsInput>({
      defaultValue: defaultAssumptions,
      onChange: onAssumptionsChange,
      value: controlledAssumptions,
    });

  const features = useMemo(() => createCreditPricingFeatures(value), [value]);
  const summary = useMemo(
    () => calculatePricingSummary(features, assumptions),
    [assumptions, features],
  );

  const commit = (nextFeatures: CreditPricingFeature[]): void => {
    updateValue(nextFeatures);
    onChange?.(nextFeatures);
  };

  return {
    addFeature: () => {
      commit(createCreditPricingFeatures([...features, { name: NEW_FEATURE_NAME }]));
    },
    assumptions,
    features,
    removeFeature: (featureId) => {
      commit(features.filter((feature) => feature.id !== featureId));
    },
    summary,
    updateAssumptions: (changes) => {
      updateAssumptionsValue({ ...assumptions, ...changes });
    },
    updateFeature: (featureId, changes) => {
      commit(
        features.map((feature) =>
          feature.id === featureId ? { ...feature, ...changes } : feature,
        ),
      );
    },
  };
}
