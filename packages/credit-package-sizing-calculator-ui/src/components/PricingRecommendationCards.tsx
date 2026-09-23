'use client';

import type { CreditPricingSummary } from '@pixpilot/credit-package-sizing-calculator';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@pixpilot/shadcn-ui';

import { useCreditPricingFormatters } from '../utils/format-context.tsx';
import { MarginStatusBadge } from './MarginStatusBadge.tsx';

export interface PricingRecommendationCardsProps {
  summary: CreditPricingSummary;
}

/**
 * The answer, before the working.
 *
 * These six cards are what an administrator came for: what is on sale now,
 * what it earns expected and worst case, and what the calculator would sell
 * instead. Everything below them exists to justify one of these figures.
 *
 * Expected and worst case are given equal room rather than the worst case
 * being a footnote, because they are the two halves of the same decision: a
 * package is only as safe as its worst case, however comfortable its average.
 */
export function PricingRecommendationCards({
  summary,
}: PricingRecommendationCardsProps): ReactNode {
  const format = useCreditPricingFormatters();
  const { currentPackage, freeTier, subscription, suggestedPackage } = summary;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SummaryCard
        detail={`${format.count(currentPackage.credits)} credits`}
        hint={`${format.count(currentPackage.standardActions)} standard ${format.count(
          summary.assumptions.standardActionCredits,
        )}-credit actions`}
        label="Current package"
        value={format.money(currentPackage.price)}
      />

      <SummaryCard
        detail="At the expected usage mix"
        label="Expected margin"
        value={format.percent(currentPackage.expectedGrossMarginPercent)}
      >
        <MarginStatusBadge status={currentPackage.expectedMarginStatus} />
      </SummaryCard>

      <SummaryCard
        detail="If every credit went to the costliest feature"
        label="Worst-case margin"
        value={format.percent(currentPackage.worstCaseGrossMarginPercent)}
      >
        <MarginStatusBadge status={currentPackage.worstCaseMarginStatus} />
      </SummaryCard>

      <SummaryCard
        detail={`${format.count(suggestedPackage.credits)} credits`}
        hint={
          suggestedPackage.isCurrentPackageComfortable
            ? `${format.count(currentPackage.credits)} credits is comfortably within your selected margin target.`
            : `Lowered from ${format.count(currentPackage.credits)} to hold the target margin.`
        }
        label="Suggested package"
        value={format.money(suggestedPackage.economics.price)}
      />

      <SummaryCard
        detail={`${format.count(subscription.credits)} credits / month`}
        hint={`${format.percent(subscription.bonusPercent)} bonus on the suggested package`}
        label="Suggested subscription"
        value={`${format.money(subscription.economics.price)} / mo`}
      >
        <MarginStatusBadge
          status={subscription.economics.bufferedWorstCaseMarginStatus}
        />
      </SummaryCard>

      <SummaryCard
        detail={`≈ ${format.count(freeTier.standardActionsPerWeek, 1)} standard actions / week`}
        hint={`≈ ${format.count(freeTier.monthlyCredits)} credits a month, costing ${format.money(
          freeTier.expectedMonthlyCost,
        )}`}
        label="Free tier"
        value={`${format.count(freeTier.creditsPerWeek)} credits / week`}
      />
    </div>
  );
}

function SummaryCard({
  children,
  detail,
  hint,
  label,
  value,
}: {
  children?: ReactNode;
  detail: string;
  hint?: string | undefined;
  label: string;
  value: string;
}): ReactNode {
  return (
    <Card>
      <CardContent className="space-y-1 py-3">
        <p className="text-muted-foreground text-[0.6875rem] tracking-wide uppercase">
          {label}
        </p>
        <p className="font-mono text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-sm">{detail}</p>
        {hint != null && <p className="text-muted-foreground text-xs">{hint}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
