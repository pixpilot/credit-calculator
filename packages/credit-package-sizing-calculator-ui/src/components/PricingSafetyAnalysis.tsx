'use client';

import type { CreditPricingSummary } from '@pixpilot/credit-package-sizing-calculator';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@pixpilot/shadcn-ui';
import { TriangleAlert } from 'lucide-react';

import { useCreditPricingFormatters } from '../utils/format-context.tsx';
import { Figure } from './Figure.tsx';
import { MarginStatusBadge } from './MarginStatusBadge.tsx';

const ICON_SIZE = 14;

export interface PricingSafetyAnalysisProps {
  summary: CreditPricingSummary;
}

/**
 * The working behind the recommendation: what a credit costs, what the target
 * margin allows, and how many credits that buys.
 *
 * The two safe limits are labelled rather than merged. The worst-case limit
 * holds however credits are spent; the expected-mix limit holds only while the
 * usage in the feature table does, and presenting it as a guarantee is how a
 * package ends up sized for a mix its users never adopted.
 */
export function PricingSafetyAnalysis({
  summary,
}: PricingSafetyAnalysisProps): ReactNode {
  const format = useCreditPricingFormatters();
  const {
    assumptions,
    currentPackage,
    freeTier,
    limits,
    mix,
    subscription,
    suggestedPackage,
  } = summary;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 py-4">
          <div>
            <h3 className="text-sm font-semibold">Cost per credit &amp; safe limits</h3>
            <p className="text-muted-foreground text-xs">
              The safety buffer of {format.percent(mix.safetyBufferPercent)} raises the
              assumed cost; it never pads revenue.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <Figure
              label="Weighted average cost / credit"
              value={format.unitMoney(mix.weightedAverageCostPerCredit)}
            />
            <Figure
              hint={
                mix.features.find((feature) => feature.isWorstCase)?.name ?? undefined
              }
              label="Worst-case cost / credit"
              value={format.unitMoney(mix.worstCaseCostPerCredit)}
            />
            <Figure
              label="Buffered weighted cost / credit"
              value={format.unitMoney(mix.bufferedWeightedAverageCostPerCredit)}
            />
            <Figure
              label="Buffered worst-case cost / credit"
              value={format.unitMoney(mix.bufferedWorstCaseCostPerCredit)}
            />
            <Figure
              hint={`What a ${format.percent(assumptions.targetGrossMarginPercent)} margin leaves for cost`}
              label="Allowed COGS / package"
              value={format.money(limits.allowedCogs)}
            />
            <Figure
              label="Revenue / credit"
              value={format.unitMoney(currentPackage.revenuePerCredit)}
            />
            <Figure
              hint="Holds however credits are spent"
              label="Worst-case safe limit"
              value={`${format.creditLimit(limits.worstCaseSafeCredits)} credits`}
            />
            <Figure
              hint="Only while usage matches the table — not a guarantee"
              label="Expected-mix safe limit"
              value={`${format.creditLimit(limits.expectedMixSafeCredits)} credits`}
            />
          </dl>

          <p className="text-muted-foreground border-border border-t pt-3 text-xs">
            {suggestedPackage.isCurrentPackageComfortable
              ? `${format.count(currentPackage.credits)} credits is comfortably within your selected margin target.`
              : `The current ${format.count(currentPackage.credits)} credits exceed the conservative limit of ${format.count(
                  suggestedPackage.conservativeCredits,
                )}. Recommending ${format.count(suggestedPackage.credits)}.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-4">
          <div>
            <h3 className="text-sm font-semibold">Margins, profit &amp; the free tier</h3>
            <p className="text-muted-foreground text-xs">
              Free credits earn nothing, so their cost is reported on its own and never
              folded into a package margin.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <Figure
              label="Expected package profit"
              value={format.money(currentPackage.expectedProfit)}
            >
              <MarginStatusBadge status={currentPackage.expectedMarginStatus} />
            </Figure>
            <Figure
              label="Worst-case package profit"
              value={format.money(currentPackage.worstCaseProfit)}
            >
              <MarginStatusBadge status={currentPackage.worstCaseMarginStatus} />
            </Figure>
            <Figure
              label="Expected profit / credit"
              value={format.unitMoney(currentPackage.expectedProfitPerCredit)}
            />
            <Figure
              label="Worst-case profit / credit"
              value={format.unitMoney(currentPackage.worstCaseProfitPerCredit)}
            />
            <Figure
              hint={`Buffered worst case ${format.percent(
                currentPackage.bufferedWorstCaseGrossMarginPercent,
              )}`}
              label="Actions / package"
              value={format.count(currentPackage.standardActions)}
            />
            <Figure
              hint={`Buffered worst case ${format.percent(
                subscription.economics.bufferedWorstCaseGrossMarginPercent,
              )}`}
              label="Actions / subscription"
              value={format.count(subscription.economics.standardActions)}
            />
            <Figure
              hint={`≈ ${format.count(freeTier.monthlyCredits)} credits`}
              label="Free allowance / month"
              value={format.money(freeTier.expectedMonthlyCost)}
            />
            <Figure
              label="Free actions / week"
              value={format.count(freeTier.standardActionsPerWeek, 1)}
            />
          </dl>

          {subscription.violatesTargetMargin && (
            <p className="text-destructive flex items-start gap-2 text-xs">
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={ICON_SIZE}
              />
              <span>
                At {format.count(subscription.credits)} credits the subscription earns{' '}
                {format.percent(
                  subscription.economics.bufferedWorstCaseGrossMarginPercent,
                )}{' '}
                in the buffered worst case, below the{' '}
                {format.percent(assumptions.targetGrossMarginPercent)} target. Lower the
                bonus, raise the price, or accept the risk deliberately.
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
