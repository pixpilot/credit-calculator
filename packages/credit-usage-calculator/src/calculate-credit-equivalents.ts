import type { CreditCalculatorConfig, CreditEquivalent } from './types';
import { creditCalculatorConfigSchema } from './schemas';

/** Calculates how many times each configured feature a credit balance can fund. */
export function calculateCreditEquivalents({
  credits,
  features,
}: CreditCalculatorConfig): CreditEquivalent[] {
  const validatedConfig = creditCalculatorConfigSchema.parse({ credits, features });

  return validatedConfig.features.map((feature) => ({
    featureId: feature.id,
    label: feature.label,
    ...(feature.description === undefined ? {} : { description: feature.description }),
    creditCost: feature.creditCost,
    quantity: Math.floor(validatedConfig.credits / feature.creditCost),
  }));
}
