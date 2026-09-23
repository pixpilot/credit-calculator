import type { z } from 'zod';

import type {
  creditPackagePricingInputSchema,
  creditPackagePricingSettingsSchema,
  featureRowSchema,
  packageRowSchema,
} from './schemas.ts';

/** One editable feature: what it charges, what it burns, how often it runs. */
export type FeatureRow = z.infer<typeof featureRowSchema>;

/** One editable package: a price and the credits it hands over. */
export type PackageRow = z.infer<typeof packageRowSchema>;

/** The model rates, target margin and fee switch every row is priced against. */
export type CreditPackagePricingSettings = z.infer<
  typeof creditPackagePricingSettingsSchema
>;

/** Everything one recalculation reads. */
export type CreditPackagePricingInput = z.infer<typeof creditPackagePricingInputSchema>;

/**
 * How a margin stands against the target it was measured against.
 *
 * Named rather than coloured, so the table can say what it means as well as
 * show it: a margin is not readable by colour alone.
 */
export type MarginStatus = 'below-target' | 'near-target' | 'on-target' | 'unknown';

/** One feature restated as what it costs us, per run and per credit. */
export interface CalculatedFeatureRow {
  /** What one credit of this feature costs, or `null` when it charges none. */
  costPerCredit: number | null;
  feature: FeatureRow;
  /** True for the one feature whose cost per credit is the worst on the screen. */
  isWorstCase: boolean;
  /** `costPerRun * quantity` — this feature's share of the monthly bill. */
  totalCost: number;
  totalCredits: number;
  /** Fixed cost plus the model cost of one run. */
  variableCost: number;
}

/** One package restated as the margins and credit ceilings it implies. */
export interface CalculatedPackageRow {
  /** Margin against the average credit, or `null` when no credit is priced. */
  blendedMargin: number | null;
  blendedStatus: MarginStatus;
  netRevenue: number;
  packageRow: PackageRow;
  stripeFee: number;
  /** Credits this price could carry at the target margin on the average credit. */
  suggestedCreditsBlended: number | null;
  /** The same ceiling, assuming every credit is spent on the costliest feature. */
  suggestedCreditsWorst: number | null;
  /** Margin if every credit went to the costliest feature. */
  worstMargin: number | null;
  worstStatus: MarginStatus;
}

/** The complete, UI-neutral result of pricing a month of usage. */
export interface CreditPackagePricingResult {
  /** `totalCost / totalCredits`, or `null` when no feature charges credits. */
  blendedCostPerCredit: number | null;
  features: CalculatedFeatureRow[];
  packages: CalculatedPackageRow[];
  settings: CreditPackagePricingSettings;
  totalCost: number;
  totalCredits: number;
  /** The highest cost per credit on the screen, or `null` when none is priced. */
  worstCostPerCredit: number | null;
  /** The feature that highest cost belongs to, so the screen can name it. */
  worstFeature: FeatureRow | null;
}
