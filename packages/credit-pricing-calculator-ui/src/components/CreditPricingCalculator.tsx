'use client';

import type {
  CreditPricingFeature,
  CreditPricingOptions,
} from '@pixpilot/credit-pricing-calculator';
import type { ReactNode } from 'react';

import { calculateCreditPricing } from '@pixpilot/credit-pricing-calculator';
import { useId, useMemo } from 'react';
import { useCreditPricingState } from '../hooks/use-credit-pricing-state.ts';
import { CreditPricingSummary } from './CreditPricingSummary.tsx';
import { CreditPricingTable } from './CreditPricingTable.tsx';

/** A margin worth opening on, and one the calculator will actually accept. */
const DEFAULT_OPTIONS: CreditPricingOptions = { safetyBuffer: 0, targetGrossMargin: 80 };

export interface CreditPricingCalculatorProps {
  className?: string | undefined;
  /** The starting features when the host does not control them. */
  defaultValue: CreditPricingFeature[];
  /** The starting margin and buffer when the host does not control them. */
  defaultOptions?: CreditPricingOptions | undefined;
  onChange?: ((value: CreditPricingFeature[]) => void) | undefined;
  onOptionsChange?: ((options: CreditPricingOptions) => void) | undefined;
  options?: CreditPricingOptions | undefined;
  /**
   * `false` when the host calculates each feature's provider cost and keeps
   * owning it, so the column is reported rather than edited here.
   */
  providerCostEditable?: boolean | undefined;
  /**
   * Heading above the calculator. `null` when the host page already names it,
   * so the screen does not say it twice.
   */
  title?: string | null | undefined;
  value?: CreditPricingFeature[] | undefined;
}

/**
 * Interactive editor for what one credit has to sell for.
 *
 * The component owns no financial arithmetic: every figure on screen comes
 * from `calculateCreditPricing`, which prices a credit from the provider cost
 * an execution already carries. Features are whatever the host supplies, so
 * adding, removing, or renaming one needs no change here.
 *
 * Editing a feature and editing the pricing settings are separate: an
 * administrator sweeping a target margin does not disturb the costs, and vice
 * versa, and either recalculates the price on the keystroke.
 */
export function CreditPricingCalculator(props: CreditPricingCalculatorProps): ReactNode {
  const {
    className,
    defaultOptions = DEFAULT_OPTIONS,
    defaultValue,
    onChange,
    onOptionsChange,
    options: controlledOptions,
    providerCostEditable,
    title = 'Credit pricing',
    value: controlledValue,
  } = props;

  const headingId = useId();
  const { update, value } = useCreditPricingState<CreditPricingFeature[]>({
    defaultValue,
    onChange,
    value: controlledValue,
  });
  const { update: updateOptions, value: options } =
    useCreditPricingState<CreditPricingOptions>({
      defaultValue: defaultOptions,
      onChange: onOptionsChange,
      value: controlledOptions,
    });

  const result = useMemo(() => calculateCreditPricing(value, options), [options, value]);

  const updateFeature = (
    featureId: string,
    changes: Partial<CreditPricingFeature>,
  ): void => {
    update((currentValue) =>
      currentValue.map((feature) =>
        feature.id === featureId ? { ...feature, ...changes } : feature,
      ),
    );
  };

  return (
    <section
      aria-label={title == null ? 'Credit pricing' : undefined}
      aria-labelledby={title == null ? undefined : headingId}
      className={className ?? 'space-y-4'}
    >
      {title != null && (
        <h2 id={headingId} className="text-xl font-semibold">
          {title}
        </h2>
      )}

      <CreditPricingSummary
        options={options}
        result={result}
        onOptionsChange={updateOptions}
      />

      <CreditPricingTable
        providerCostEditable={providerCostEditable}
        result={result}
        onFeatureChange={updateFeature}
      />
    </section>
  );
}
