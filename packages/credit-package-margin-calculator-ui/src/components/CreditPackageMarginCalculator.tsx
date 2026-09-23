'use client';

import type {
  CreditPackageFeatureScenario,
  CreditPackagePricingSettings,
  FeatureRow,
  PackageRow,
} from '@pixpilot/credit-package-margin-calculator';
import type { ReactNode } from 'react';

import {
  calculateCreditPackagePricing,
  createFeatureRows,
  DEFAULT_CREDIT_PACKAGE_PRICING_SETTINGS,
  DEFAULT_FEATURE_SCENARIOS,
  DEFAULT_PACKAGE_ROWS,
} from '@pixpilot/credit-package-margin-calculator';
import { cn } from '@pixpilot/shadcn';
import { useId, useMemo } from 'react';
import { useCreditPackagePricingState } from '../hooks/use-credit-package-pricing-state.ts';
import { useIdentifiedRows } from '../hooks/use-identified-rows.ts';
import {
  createBlankFeatureRow,
  createBlankPackageRow,
} from '../utils/create-blank-rows.ts';
import { CreditPackageTable } from './CreditPackageTable.tsx';
import { FeatureCostTable } from './FeatureCostTable.tsx';
import { PricingAssumptionsPanel } from './PricingAssumptionsPanel.tsx';
import { PricingSummaryStrip } from './PricingSummaryStrip.tsx';

export interface CreditPackageMarginCalculatorProps {
  className?: string | undefined;
  /**
   * The packs the calculator opens on, when the host does not control them.
   */
  defaultPackages?: PackageRow[] | undefined;
  /** The assumptions it opens on, when the host does not control them. */
  defaultSettings?: CreditPackagePricingSettings | undefined;
  /**
   * The features the table opens on, when the host does not control them.
   *
   * Cost scenarios an application already maintains pass straight in: the
   * fields a scenario leaves out are filled in on the way, and ids are derived
   * from the names.
   */
  defaultValue?: readonly CreditPackageFeatureScenario[] | undefined;
  onChange?: ((features: FeatureRow[]) => void) | undefined;
  onPackagesChange?: ((packages: PackageRow[]) => void) | undefined;
  onSettingsChange?: ((settings: CreditPackagePricingSettings) => void) | undefined;
  packages?: PackageRow[] | undefined;
  settings?: CreditPackagePricingSettings | undefined;
  /**
   * Heading above the calculator. `null` when the host page already names it,
   * so the screen does not say it twice.
   */
  title?: string | null | undefined;
  value?: FeatureRow[] | undefined;
}

/**
 * A live model of what a month of credit usage costs and what each pack we
 * sell earns on it.
 *
 * The component owns no financial arithmetic: every figure on screen comes
 * from `calculateCreditPackagePricing`, recomputed on the keystroke, so the
 * feature table, the summary and the package margins can never disagree about
 * the same edit.
 *
 * The three editable values — features, packages, assumptions — are held apart
 * so that sweeping the target margin does not disturb a token estimate, and
 * each can be controlled by a host independently of the other two.
 *
 * The panel renders on its own dark surface whatever the page around it is
 * set to. This is an instrument for reading many small figures at once rather
 * than a page of content, and the dark ground is what keeps a table this dense
 * legible.
 */
export function CreditPackageMarginCalculator(
  props: CreditPackageMarginCalculatorProps,
): ReactNode {
  const {
    className,
    defaultPackages,
    defaultSettings = DEFAULT_CREDIT_PACKAGE_PRICING_SETTINGS,
    defaultValue = DEFAULT_FEATURE_SCENARIOS,
    onChange,
    onPackagesChange,
    onSettingsChange,
    packages: controlledPackages,
    settings: controlledSettings,
    title = 'Credit package pricing',
    value: controlledValue,
  } = props;

  const headingId = useId();
  const defaultFeatureRows = useMemo(
    () => createFeatureRows(defaultValue),
    [defaultValue],
  );

  const features = useIdentifiedRows<FeatureRow>({
    createRow: createBlankFeatureRow,
    defaultValue: defaultFeatureRows,
    onChange,
    value: controlledValue,
  });

  const packages = useIdentifiedRows<PackageRow>({
    createRow: createBlankPackageRow,
    defaultValue: defaultPackages ?? [...DEFAULT_PACKAGE_ROWS],
    onChange: onPackagesChange,
    value: controlledPackages,
  });

  const { update: updateSettings, value: settings } =
    useCreditPackagePricingState<CreditPackagePricingSettings>({
      defaultValue: defaultSettings,
      onChange: onSettingsChange,
      value: controlledSettings,
    });

  const result = useMemo(
    () =>
      calculateCreditPackagePricing({
        features: features.rows,
        packages: packages.rows,
        settings,
      }),
    [features.rows, packages.rows, settings],
  );

  return (
    <section
      aria-label={title == null ? 'Credit package pricing' : undefined}
      aria-labelledby={title == null ? undefined : headingId}
      className={cn(
        'dark bg-background text-foreground border-border/60 space-y-px border',
        className,
      )}
    >
      {title != null && (
        <h2
          id={headingId}
          className="border-border/60 border-b px-3 py-2 text-sm font-medium tracking-[0.08em] uppercase"
        >
          {title}
        </h2>
      )}

      <PricingAssumptionsPanel settings={settings} onSettingsChange={updateSettings} />
      <PricingSummaryStrip result={result} />
      <FeatureCostTable
        result={result}
        onAddFeature={features.add}
        onFeatureChange={features.update}
        onRemoveFeature={features.remove}
      />
      <CreditPackageTable
        result={result}
        onAddPackage={packages.add}
        onPackageChange={packages.update}
        onRemovePackage={packages.remove}
      />
    </section>
  );
}
