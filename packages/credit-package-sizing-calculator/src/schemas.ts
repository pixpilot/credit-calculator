import { z } from 'zod';

const MAX_NAME_LENGTH = 256;
const MAX_USD_AMOUNT = 1_000_000_000;
const MAX_TOKENS = 100_000_000;
const MAX_QUANTITY = 10_000_000;
const MAX_CREDITS = 100_000_000;
const MAX_PERCENT = 1_000;
const MAX_SCENARIOS = 24;
/**
 * The largest gross margin that still leaves a share of revenue to divide by.
 * A 100% margin allows no cost at all, so the safe credit limit it implies is
 * a division by zero rather than an answer.
 */
const MAX_TARGET_GROSS_MARGIN = 99.999999;

/** The defaults every optional feature figure falls back to. */
const DEFAULT_CREDITS_PER_EXECUTION = 1;
const DEFAULT_QUANTITY = 1;
const NO_TOKENS = 0;
const NO_FIXED_COST = 0;

/** The defaults an administrator rarely changes but may. */
const DEFAULT_PACKAGE_INCREMENT = 25;
const DEFAULT_STANDARD_ACTION_CREDITS = 5;
const DEFAULT_RECOMMENDATION_HEADROOM_PERCENT = 10;
const DEFAULT_HEALTHY_MARGIN_POINTS = 5;

/** The package sizes worth putting side by side out of the box. */
export const DEFAULT_SCENARIO_CREDITS: readonly number[] = [500, 700, 1_000];

const nameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);
const usdAmountSchema = z.number().finite().nonnegative().max(MAX_USD_AMOUNT);
const percentSchema = z.number().finite().nonnegative().max(MAX_PERCENT);
const creditCountSchema = z.number().int().nonnegative().max(MAX_CREDITS).safe();

/** Runtime schema for prompt or completion tokens one execution spends. */
export const tokenCountSchema = z.number().int().nonnegative().max(MAX_TOKENS).safe();

/** Runtime schema for how many times a feature is expected to run. */
export const quantitySchema = z.number().int().nonnegative().max(MAX_QUANTITY).safe();

/**
 * Runtime schema for the credits one execution charges.
 *
 * At least one: a feature that charges nothing has no cost per credit, and
 * letting it through is how a division by zero reaches the worst-case figure
 * the whole price is built from.
 */
export const creditsPerExecutionSchema = z
  .number()
  .int()
  .positive()
  .max(MAX_CREDITS)
  .safe();

/** Runtime schema for a non-model cost one execution carries. */
export const fixedCostPerExecutionSchema = usdAmountSchema;

/** Runtime schema for the gross margin an administrator wants to hold. */
export const targetGrossMarginPercentSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(MAX_TARGET_GROSS_MARGIN, 'Target gross margin must be below 100%');

/** Runtime schema for one credit-consuming feature and its usage estimate. */
export const creditPricingFeatureSchema = z.object({
  creditsPerExecution: creditsPerExecutionSchema.default(DEFAULT_CREDITS_PER_EXECUTION),
  fixedCostName: nameSchema.optional(),
  fixedCostPerExecution: fixedCostPerExecutionSchema.default(NO_FIXED_COST),
  /** Row identity. Derived from the name when a caller supplies none. */
  id: nameSchema.optional(),
  inputTokens: tokenCountSchema.default(NO_TOKENS),
  name: nameSchema,
  outputTokens: tokenCountSchema.default(NO_TOKENS),
  quantity: quantitySchema.default(DEFAULT_QUANTITY),
});

/** Runtime schema for the features a whole calculation is run over. */
export const creditPricingFeaturesSchema = z.array(creditPricingFeatureSchema);

/**
 * Runtime schema for everything the features are priced against.
 *
 * The buffer, the target margin, and the package price are separate figures on
 * purpose: each protects against a different thing, and collapsing them into
 * one number is what hides which of them a package is actually failing.
 */
export const creditPricingAssumptionsSchema = z.object({
  /** The package sizes a recommendation is rounded down to a multiple of. */
  creditPackageIncrement: z
    .number()
    .int()
    .positive()
    .max(MAX_CREDITS)
    .default(DEFAULT_PACKAGE_INCREMENT),
  currentPackageCredits: creditCountSchema,
  freeCreditsPerWeek: creditCountSchema,
  /** Percentage points above target at which a margin counts as healthy. */
  healthyMarginPoints: percentSchema.default(DEFAULT_HEALTHY_MARGIN_POINTS),
  inputCostPerMillionTokens: usdAmountSchema,
  outputCostPerMillionTokens: usdAmountSchema,
  packagePrice: usdAmountSchema,
  /** How far below the safe maximum a recommendation deliberately stops. */
  recommendationHeadroomPercent: z
    .number()
    .finite()
    .nonnegative()
    .max(MAX_TARGET_GROSS_MARGIN)
    .default(DEFAULT_RECOMMENDATION_HEADROOM_PERCENT),
  safetyBufferPercent: percentSchema,
  /** Extra package sizes to compare against the current one. */
  scenarioCredits: z
    .array(creditCountSchema)
    .max(MAX_SCENARIOS)
    .default([...DEFAULT_SCENARIO_CREDITS]),
  /** The credits a typical AI action charges, for reading a package in actions. */
  standardActionCredits: creditsPerExecutionSchema.default(
    DEFAULT_STANDARD_ACTION_CREDITS,
  ),
  subscriptionCreditBonusPercent: percentSchema,
  targetGrossMarginPercent: targetGrossMarginPercentSchema,
});
