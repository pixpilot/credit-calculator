import { z } from 'zod';

import { isDecimalAmount } from './money.ts';

const MAX_USD_AMOUNT = 1_000_000_000;
const MAX_CREDITS_PER_EXECUTION = 1_000_000;
const MAX_NAME_LENGTH = 256;
const MAX_SAFETY_BUFFER = 1_000;
const MAX_ROUNDING_DECIMAL_PLACES = 12;
/**
 * The largest gross margin micro-percent can express while `1 - margin` is
 * still something to divide by. A 100% margin has no price that satisfies it:
 * the formula divides by zero, so the input is rejected rather than answered
 * with `Infinity`.
 */
const MAX_TARGET_GROSS_MARGIN = 99.999999;

const nonEmptyNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

/** Runtime schema for an exact amount produced by `@pixpilot/cost-calculator`. */
export const moneySchema = z.object({
  amount: z
    .string()
    .refine(isDecimalAmount, 'Amount must be a non-negative decimal number'),
  currency: z.literal('USD'),
});

/**
 * Runtime schema for what one execution of a feature costs us.
 *
 * Either an exact amount straight from a cost or allocation calculation, or a
 * plain number for a caller writing one out by hand.
 */
export const providerCostPerExecutionSchema = z.union([
  moneySchema,
  z.number().finite().nonnegative().max(MAX_USD_AMOUNT),
]);

/**
 * Runtime schema for the credits an administrator decides one execution
 * consumes. Zero models a deliberately free feature.
 */
export const creditsPerExecutionSchema = z
  .number()
  .int()
  .nonnegative()
  .max(MAX_CREDITS_PER_EXECUTION)
  .safe();

/** Runtime schema for one feature whose cost a credit has to cover. */
export const creditPricingFeatureSchema = z.object({
  creditsPerExecution: creditsPerExecutionSchema,
  /** Defaults to enabled; a disabled feature is priced but never sets the price. */
  enabled: z.boolean().optional(),
  id: nonEmptyNameSchema,
  label: nonEmptyNameSchema,
  providerCostPerExecution: providerCostPerExecutionSchema,
});

/** Runtime schema for the features in a complete credit pricing calculation. */
export const creditPricingFeaturesSchema = z
  .array(creditPricingFeatureSchema)
  .min(1)
  .superRefine((features, context) => {
    const seenIds = new Set<string>();

    features.forEach((feature, featureIndex) => {
      if (seenIds.has(feature.id)) {
        context.addIssue({
          code: 'custom',
          message: `Feature id "${feature.id}" must be unique`,
          path: [featureIndex, 'id'],
        });
      }
      seenIds.add(feature.id);
    });
  });

/**
 * Runtime schema for the gross margin to price for, as a percentage.
 *
 * Gross margin is `(revenue - provider cost) / revenue`, not a markup on cost,
 * so it is bounded below 100%.
 */
export const targetGrossMarginSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(MAX_TARGET_GROSS_MARGIN, 'Target gross margin must be below 100%');

/** Runtime schema for the percentage added to provider cost before pricing. */
export const safetyBufferSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(MAX_SAFETY_BUFFER);

/** Runtime schema for the decimal places a recommended price rounds up to. */
export const roundUpToDecimalPlacesSchema = z
  .number()
  .int()
  .nonnegative()
  .max(MAX_ROUNDING_DECIMAL_PLACES);

/** Runtime schema for the settings an administrator prices against. */
export const creditPricingOptionsSchema = z.object({
  roundUpToDecimalPlaces: roundUpToDecimalPlacesSchema.optional(),
  safetyBuffer: safetyBufferSchema.optional(),
  targetGrossMargin: targetGrossMarginSchema,
});
