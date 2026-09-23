'use client';

import type { CreditPackagePricingResult } from '@pixpilot/credit-package-margin-calculator';
import type { ReactNode } from 'react';

import { formatCount, formatUnitUsd, formatUsd } from '../utils/format-number.ts';
import { PricingStatCard } from './PricingStatCard.tsx';

export interface PricingSummaryStripProps {
  result: CreditPackagePricingResult;
}

/**
 * The four figures the rest of the screen argues about.
 *
 * The blended and worst-case rates sit side by side because a package is only
 * safe when it clears the target on the second: showing the average alone is
 * how a pack that loses money on its heaviest users reads as profitable.
 */
export function PricingSummaryStrip({ result }: PricingSummaryStripProps): ReactNode {
  return (
    <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
      <PricingStatCard
        label="Monthly cost"
        subtitle="One active user"
        value={formatUsd(result.totalCost)}
      />
      <PricingStatCard
        label="Credits issued"
        subtitle="Across the mix below"
        value={formatCount(result.totalCredits)}
      />
      <PricingStatCard
        label="Blended $ / credit"
        subtitle="Cost ÷ credits"
        value={formatUnitUsd(result.blendedCostPerCredit)}
      />
      <PricingStatCard
        label="Worst-case $ / credit"
        subtitle={result.worstFeature?.name ?? 'No feature charges credits'}
        value={formatUnitUsd(result.worstCostPerCredit)}
      />
    </div>
  );
}
