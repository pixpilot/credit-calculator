'use client';

import type {
  CreditPricingOptions,
  CreditPricingResult,
} from '@pixpilot/credit-pricing-calculator';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@pixpilot/shadcn-ui';
import { formatUnitUsd, formatUsd } from '../utils/format-money.ts';
import { CreditPricingSettings } from './CreditPricingSettings.tsx';

const NO_SAFETY_BUFFER = 0;

export interface CreditPricingSummaryProps {
  options: CreditPricingOptions;
  result: CreditPricingResult;
  onOptionsChange: (options: CreditPricingOptions) => void;
}

/**
 * What the whole screen exists to answer — what one credit has to sell for —
 * pinned above the features that decide it.
 *
 * The margin and buffer controls sit in the same card as the price they
 * produce, because every one of them changes it: an administrator trying a
 * different margin should never have to scroll away from the control to find
 * out what it did.
 *
 * The margin and buffer read back from the controls that set them rather than
 * being restated beside them: one editable figure cannot disagree with itself.
 *
 * Provider cost and selling price are never abbreviated to the same word here.
 * A figure is either what a credit *costs us* or what a credit *sells for*,
 * and a screen that blurs the two is one that prices a product at cost.
 */
export function CreditPricingSummary({
  onOptionsChange,
  options,
  result,
}: CreditPricingSummaryProps): ReactNode {
  const priceSettingFeature = result.features.find((feature) => feature.isPriceSetting);

  return (
    <div className="sticky top-0 z-10">
      <Card className="py-3">
        <CardContent className="space-y-4">
          <CreditPricingSettings options={options} onChange={onOptionsChange} />

          <dl className="text-muted-foreground flex flex-wrap items-center gap-x-4 text-xs">
            <PricingFigure
              label="Worst-case provider cost / credit"
              value={formatUnitUsd(result.worstCaseProviderCostPerCredit)}
            />
            {result.safetyBuffer > NO_SAFETY_BUFFER && (
              <PricingFigure
                label="Buffered provider cost / credit"
                value={formatUnitUsd(result.bufferedProviderCostPerCredit)}
              />
            )}
            <PricingFigure
              label="Price-setting feature"
              value={priceSettingFeature?.label ?? '—'}
            />
          </dl>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <SummaryFigure
              label="Minimum credit price"
              value={formatPrice(result.minimumCreditPrice)}
            />
            {result.recommendedCreditPrice != null && (
              <SummaryFigure
                label="Recommended credit price"
                value={formatPrice(result.recommendedCreditPrice)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatPrice(price: CreditPricingResult['minimumCreditPrice']): string {
  return price == null ? '—' : formatUsd(price);
}

function SummaryFigure({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex items-center gap-3">
      <p className="text-muted-foreground text-[0.6875rem] tracking-wide uppercase">
        {label}
      </p>
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function PricingFigure({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex items-baseline gap-1">
      <dt>{label}</dt>
      <dd className="text-foreground font-mono font-medium tabular-nums">{value}</dd>
    </div>
  );
}
