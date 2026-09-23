import { z } from 'zod';

const creditsSchema = z.number().int().nonnegative();

/** Runtime schema for a configurable credit-backed feature. */
export const creditFeatureSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  creditCost: z.number().int().positive(),
});

/** Runtime schema for a selected feature quantity. */
export const creditUsageSchema = z.object({
  featureId: z.string().trim().min(1),
  quantity: z.number().int().nonnegative(),
});

function addDuplicateFeatureIssues(
  features: readonly { id: string }[],
  context: z.RefinementCtx,
) {
  const seenFeatureIds = new Set<string>();

  features.forEach((feature, index) => {
    if (seenFeatureIds.has(feature.id)) {
      context.addIssue({
        code: 'custom',
        message: `Feature id "${feature.id}" must be unique.`,
        path: ['features', index, 'id'],
      });
      return;
    }

    seenFeatureIds.add(feature.id);
  });
}

/** Runtime schema for a reusable calculator configuration. */
export const creditCalculatorConfigSchema = z
  .object({
    credits: creditsSchema,
    features: z.array(creditFeatureSchema),
  })
  .superRefine(({ features }, context) => {
    addDuplicateFeatureIssues(features, context);
  });

/** Runtime schema for inputs that include user-selected quantities. */
export const creditUsageCalculationInputSchema = z
  .object({
    credits: creditsSchema,
    features: z.array(creditFeatureSchema),
    usage: z.array(creditUsageSchema).optional().default([]),
  })
  .superRefine(({ features, usage }, context) => {
    addDuplicateFeatureIssues(features, context);

    const featureIds = new Set(features.map((feature) => feature.id));
    const selectedFeatureIds = new Set<string>();

    usage.forEach((selection, index) => {
      if (!featureIds.has(selection.featureId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown feature id "${selection.featureId}".`,
          path: ['usage', index, 'featureId'],
        });
      }

      if (selectedFeatureIds.has(selection.featureId)) {
        context.addIssue({
          code: 'custom',
          message: `Usage for feature id "${selection.featureId}" must be unique.`,
          path: ['usage', index, 'featureId'],
        });
      }

      selectedFeatureIds.add(selection.featureId);
    });
  });
