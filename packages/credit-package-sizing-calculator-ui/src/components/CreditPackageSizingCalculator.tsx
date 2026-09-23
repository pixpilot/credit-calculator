'use client';

import type {
  CreditPricingAssumptionsInput,
  CreditPricingFeature,
  CreditPricingFeatureInput,
} from '@pixpilot/credit-package-sizing-calculator';
import type { ReactNode } from 'react';

import type { CreditPricingFormat } from '../utils/format.ts';

import { useId } from 'react';

import { DEFAULT_CREDIT_PRICING_ASSUMPTIONS } from '../default-assumptions.ts';
import { useCreditPricingCalculator } from '../hooks/use-credit-pricing-calculator.ts';
import { CreditPricingFormatProvider } from '../utils/format-context.tsx';
import { CreditPricingAssumptionsForm } from './CreditPricingAssumptionsForm.tsx';
import { FeatureCostTable } from './FeatureCostTable.tsx';
import { PricingRecommendationCards } from './PricingRecommendationCards.tsx';
import { PricingSafetyAnalysis } from './PricingSafetyAnalysis.tsx';
import { PricingScenarioComparison } from './PricingScenarioComparison.tsx';

export interface CreditPackageSizingCalculatorProps {
  /** The starting assumptions when the host does not control them. */
  assumptions?: CreditPricingAssumptionsInput | undefined;
  className?: string | undefined;
  defaultAssumptions?: CreditPricingAssumptionsInput | undefined;
  /**
   * The features to price. Every field but the name is optional, so a scenario
   * list an application already keeps for its cost calculators can be handed
   * over as it stands.
   */
  defaultValue: readonly CreditPricingFeatureInput[];
  /** How amounts and percentages are written. United States dollars by default. */
  format?: CreditPricingFormat | undefined;
  onAssumptionsChange?:
    ((assumptions: CreditPricingAssumptionsInput) => void) | undefined;
  onChange?: ((features: CreditPricingFeature[]) => void) | undefined;
  /**
   * Heading above the calculator. `null` when the host page already names it,
   * so the screen does not say it twice.
   */
  title?: string | null | undefined;
  value?: readonly CreditPricingFeatureInput[] | undefined;
}

/**
 * An internal model of what credits cost, what a package may include, and what
 * that leaves as margin.
 *
 * The component owns no financial arithmetic. Every figure on screen comes
 * from `calculatePricingSummary`, recalculated on the keystroke, so there is no
 * second copy of a margin to fall out of step with the inputs that produced
 * it. Features and assumptions are edited independently: sweeping a target
 * margin never disturbs a token estimate, and vice versa.
 *
 * The panels are ordered as the decision is made — the recommendation first,
 * then the feature costs it was derived from, then the safety analysis and the
 * package sizes that argue for it — rather than as the calculation runs.
 */
export function CreditPackageSizingCalculator({
  assumptions: controlledAssumptions,
  className,
  defaultAssumptions = DEFAULT_CREDIT_PRICING_ASSUMPTIONS,
  defaultValue,
  format,
  onAssumptionsChange,
  onChange,
  title = 'Credit pricing calculator',
  value,
}: CreditPackageSizingCalculatorProps): ReactNode {
  const headingId = useId();
  const {
    addFeature,
    features,
    removeFeature,
    summary,
    updateAssumptions,
    updateFeature,
  } = useCreditPricingCalculator({
    assumptions: controlledAssumptions,
    defaultAssumptions,
    defaultValue,
    onAssumptionsChange,
    onChange,
    value,
  });

  return (
    <CreditPricingFormatProvider format={format}>
      <section
        aria-label={title == null ? 'Credit pricing calculator' : undefined}
        aria-labelledby={title == null ? undefined : headingId}
        className={className ?? 'space-y-4'}
      >
        {title != null && (
          <h2 id={headingId} className="text-xl font-semibold">
            {title}
          </h2>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <CreditPricingAssumptionsForm
            assumptions={summary.assumptions}
            onChange={updateAssumptions}
          />
          <PricingRecommendationCards summary={summary} />
        </div>

        <FeatureCostTable
          features={features}
          mix={summary.mix}
          onAdd={addFeature}
          onChange={updateFeature}
          onRemove={removeFeature}
        />

        <PricingSafetyAnalysis summary={summary} />

        <PricingScenarioComparison
          summary={summary}
          onScenarioCreditsChange={(scenarioCredits) =>
            updateAssumptions({ scenarioCredits })
          }
        />
      </section>
    </CreditPricingFormatProvider>
  );
}
