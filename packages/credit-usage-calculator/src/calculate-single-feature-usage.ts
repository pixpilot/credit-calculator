import type {
  SingleFeatureCreditUsageInput,
  SingleFeatureCreditUsageResult,
} from './types';
import { calculateCreditUsage } from './calculate-credit-usage';

/** Calculates one selected feature and equivalent usage for the remaining balance. */
export function calculateSingleFeatureUsage({
  credits,
  features,
  featureId,
  quantity,
}: SingleFeatureCreditUsageInput): SingleFeatureCreditUsageResult {
  const result = calculateCreditUsage({
    credits,
    features,
    usage: [{ featureId, quantity }],
  });
  const selectedFeature = result.features.find((feature) => feature.id === featureId);

  if (selectedFeature === undefined) {
    throw new Error(`Configured feature "${featureId}" could not be found.`);
  }

  return {
    ...result,
    selectedFeatureId: featureId,
    selectedFeature,
    equivalents: result.equivalents.filter(
      (equivalent) => equivalent.featureId !== featureId,
    ),
  };
}
