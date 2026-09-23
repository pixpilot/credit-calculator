import type {
  CalculatedCreditFeature,
  CreditUsageCalculationInput,
  CreditUsageResult,
} from './types';
import { calculateCreditEquivalents } from './calculate-credit-equivalents';
import { creditUsageCalculationInputSchema } from './schemas';

/** Calculates selected usage, remaining balance, limits, and equivalent feature usage. */
export function calculateCreditUsage(
  input: CreditUsageCalculationInput,
): CreditUsageResult {
  const validatedInput = creditUsageCalculationInputSchema.parse(input);
  const quantitiesByFeatureId = new Map(
    validatedInput.usage.map((selection) => [selection.featureId, selection.quantity]),
  );

  const features: CalculatedCreditFeature[] = validatedInput.features.map((feature) => {
    const quantity = quantitiesByFeatureId.get(feature.id) ?? 0;
    const usedCredits = quantity * feature.creditCost;

    return {
      ...feature,
      quantity,
      usedCredits,
      maxQuantityFromTotal: Math.floor(validatedInput.credits / feature.creditCost),
      maxQuantityFromRemaining: 0,
    };
  });
  const usedCredits = features.reduce((total, feature) => total + feature.usedCredits, 0);
  const remainingCredits = Math.max(validatedInput.credits - usedCredits, 0);
  const overBudgetCredits = Math.max(usedCredits - validatedInput.credits, 0);

  const calculatedFeatures = features.map((feature) => ({
    ...feature,
    maxQuantityFromRemaining: Math.floor(remainingCredits / feature.creditCost),
  }));

  return {
    totalCredits: validatedInput.credits,
    usedCredits,
    remainingCredits,
    isWithinBudget: overBudgetCredits === 0,
    overBudgetCredits,
    features: calculatedFeatures,
    equivalents: calculateCreditEquivalents({
      credits: remainingCredits,
      features: validatedInput.features,
    }),
  };
}
