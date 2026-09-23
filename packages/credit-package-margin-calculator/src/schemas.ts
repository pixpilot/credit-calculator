import { z } from 'zod';

/**
 * The bounds a figure has to stay inside to be priced at all.
 *
 * Exported so an editor can hold its fields inside them rather than let a
 * pasted figure throw out of the calculation it was typed into.
 */
export const MAX_USD_AMOUNT = 1_000_000_000;
export const MAX_CREDITS = 100_000_000;
export const MAX_TOKENS = 100_000_000;
export const MAX_QUANTITY = 1_000_000;
export const MAX_NAME_LENGTH = 256;
const MIN_TARGET_MARGIN = 0;
/**
 * A 100% margin is unreachable: it would need a credit that costs nothing, so
 * the slider stops short of it rather than reporting a target no package can
 * ever satisfy.
 */
const MAX_TARGET_MARGIN = 99.99;

const nonEmptyNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);
const usdAmountSchema = z.number().finite().nonnegative().max(MAX_USD_AMOUNT);
const tokenCountSchema = z.number().int().nonnegative().max(MAX_TOKENS).safe();

/** Runtime schema for one credit-charging feature the calculator prices. */
export const featureRowSchema = z.object({
  /** Zero models a feature deliberately given away; it then has no cost per credit. */
  creditCost: z.number().int().nonnegative().max(MAX_CREDITS).safe(),
  /** Non-model cost of one run, such as a worker invocation or a PDF render. */
  fixedCost: usdAmountSchema,
  id: nonEmptyNameSchema,
  inputTokens: tokenCountSchema,
  name: nonEmptyNameSchema,
  outputTokens: tokenCountSchema,
  /** Runs a month, so the totals read as the monthly spend of one active user. */
  quantity: z.number().int().nonnegative().max(MAX_QUANTITY).safe(),
});

/** Runtime schema for one credit package an administrator sells. */
export const packageRowSchema = z.object({
  credits: z.number().int().nonnegative().max(MAX_CREDITS).safe(),
  id: nonEmptyNameSchema,
  price: usdAmountSchema,
});

/** Runtime schema for the assumptions every row on the screen is priced against. */
export const creditPackagePricingSettingsSchema = z.object({
  inputPricePerMillionTokens: usdAmountSchema,
  outputPricePerMillionTokens: usdAmountSchema,
  /** Whether package revenue is read net of the payment processor's cut. */
  stripeFeesEnabled: z.boolean(),
  targetMargin: z.number().finite().min(MIN_TARGET_MARGIN).max(MAX_TARGET_MARGIN),
});

/** Runtime schema for a complete calculation: features, packages and settings. */
export const creditPackagePricingInputSchema = z.object({
  features: z.array(featureRowSchema).superRefine(assertUniqueIds),
  packages: z.array(packageRowSchema).superRefine(assertUniqueIds),
  settings: creditPackagePricingSettingsSchema,
});

function assertUniqueIds(
  rows: readonly { id: string }[],
  context: z.RefinementCtx,
): void {
  const seenIds = new Set<string>();

  rows.forEach((row, rowIndex) => {
    if (seenIds.has(row.id)) {
      context.addIssue({
        code: 'custom',
        message: `Row id "${row.id}" must be unique`,
        path: [rowIndex, 'id'],
      });
    }
    seenIds.add(row.id);
  });
}
