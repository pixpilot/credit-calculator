import type { CreditFeature, CreditUsage } from '@pixpilot/credit-usage-calculator';
import type { CreditCalculatorView } from './credit-calculator-view';

/**
 * A worked example of a period of use, offered as a starting point for the
 * planning view's sliders.
 */
export interface CreditUsagePreset {
  id: string;
  label: string;
  /** Quantities to fill the sliders with. Zero-quantity entries may be omitted. */
  usage: readonly CreditUsage[];
  /** Marks the example an otherwise unconfigured calculator opens on. */
  isDefault?: boolean | undefined;
}

/** Props for the reusable interactive credit calculator. */
export interface CreditCalculatorProps {
  /** Controlled credit balance. Omit to let the visitor edit it in place. */
  credits?: number | undefined;
  /** Starting balance for an uncontrolled one, shown in an editable field. */
  initialCredits?: number | undefined;
  /** Observes balance edits in either controlled or uncontrolled mode. */
  onCreditsChange?: ((credits: number) => void) | undefined;
  features: readonly CreditFeature[];
  /** Controlled selected quantities. Omit to let the component manage quantities. */
  usage?: readonly CreditUsage[] | undefined;
  /** Initial quantities for uncontrolled usage. Defaults to the default preset. */
  initialUsage?: readonly CreditUsage[] | undefined;
  /**
   * Worked usage examples offered in the planning view. Each is a starting
   * point the visitor can then drag into their own shape, so they need only be
   * plausible — the sliders, not this list, are the answer.
   */
  usagePresets?: readonly CreditUsagePreset[] | undefined;
  /** Observes quantity changes in either controlled or uncontrolled usage mode. */
  onUsageChange?: ((usage: readonly CreditUsage[]) => void) | undefined;
  /**
   * Which of the two calculators are on offer. Defaults to both. Listing one
   * settles the question the view switch asks, so the switch is not shown and
   * the calculator stays in that view.
   */
  views?: readonly CreditCalculatorView[] | undefined;
  /** The feature the spending view is focused on, or `null` to plan usage. */
  selectedFeatureId?: string | null | undefined;
  /** Which view an uncontrolled calculator opens on, by the same rule. */
  initialSelectedFeatureId?: string | null | undefined;
  /** Observes feature view changes in either controlled or uncontrolled mode. */
  onSelectedFeatureChange?: ((featureId: string | null) => void) | undefined;
  /** How far each slider runs in the balance-free planning view. */
  plannedQuantityLimit?: number | undefined;
  /** Optional heading that replaces the default credit-based prompt. */
  title?: string | undefined;
  /** Additional classes for the calculator card. */
  className?: string | undefined;
}
