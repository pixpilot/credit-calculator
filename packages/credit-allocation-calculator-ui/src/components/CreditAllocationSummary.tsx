'use client';

import type {
  CalculatedCreditPricingScenario,
  CreditAllocationResult,
} from '@pixpilot/credit-allocation-calculator';
import type { ReactNode } from 'react';
import type { CreditAllocationModel } from '../types.ts';

import { Card, CardContent, Select } from '@pixpilot/shadcn-ui';
import { formatPercent, formatUnitUsd, formatUsd } from '../utils/format-money.ts';

/** What the summary shows where a figure is undefined, as the money helpers do. */
const ABSENT = '—';

export interface CreditAllocationSummaryProps {
  model: CreditAllocationModel;
  /** The scenario whose economics the summary reports, if one is selected. */
  pricing?: CalculatedCreditPricingScenario | undefined;
  /** Every scenario the host offers, which the selector chooses between. */
  pricingScenarios?: CalculatedCreditPricingScenario[] | undefined;
  result: CreditAllocationResult;
  onPricingScenarioChange?: ((scenarioId: string) => void) | undefined;
}

/**
 * The numbers the whole screen exists to produce, pinned above the table.
 *
 * It sticks because every slider below it changes these: an administrator
 * comparing allocations should never have to scroll away from a control to
 * find out what it did.
 *
 * The provider figures are what the workload costs to serve and never move
 * when credits are reallocated. The revenue figures beside them are what those
 * credits are worth under the selected pricing scenario, and do — which is the
 * comparison the two halves of this card exist to make.
 */
export function CreditAllocationSummary({
  model,
  onPricingScenarioChange,
  pricing,
  pricingScenarios,
  result,
}: CreditAllocationSummaryProps): ReactNode {
  return (
    <div className="sticky top-0 z-10">
      <Card className="py-3">
        <CardContent className="space-y-4">
          <dl className="text-muted-foreground flex flex-wrap items-center gap-x-4 text-xs">
            <ModelFigure label="Model" value={getModelName(model)} />
            <ModelFigure
              label="Input"
              value={`${formatUsd({
                amount: model.inputPricePerMillionTokens.toString(),
                currency: 'USD',
              })} / 1M`}
            />
            <ModelFigure
              label="Output"
              value={`${formatUsd({
                amount: model.outputPricePerMillionTokens.toString(),
                currency: 'USD',
              })} / 1M`}
            />
            {model.contextLength != null && (
              <ModelFigure
                label="Context"
                value={formatTokenLimit(model.contextLength)}
              />
            )}
            {model.maxOutputTokens != null && (
              <ModelFigure
                label="Max output"
                value={formatTokenLimit(model.maxOutputTokens)}
              />
            )}
          </dl>

          {pricing != null && pricingScenarios != null && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Select
                aria-label="Pricing scenario"
                className="w-56"
                options={pricingScenarios.map((scenario) => ({
                  label: scenario.scenario.label,
                  value: scenario.scenario.id,
                }))}
                size="sm"
                value={pricing.scenario.id}
                onChange={(scenarioId) => onPricingScenarioChange?.(scenarioId)}
              />
              <dl className="text-muted-foreground flex flex-wrap items-center gap-x-4 text-xs">
                <ModelFigure
                  label="Package price"
                  value={formatUsd(pricing.scenario.packagePrice)}
                />
                <ModelFigure
                  label="Spendable credits"
                  value={pricing.spendableCredits.toLocaleString()}
                />
                <ModelFigure
                  label="Revenue / credit"
                  value={formatUnitUsd(pricing.effectiveRevenuePerCredit)}
                />
              </dl>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <SummaryFigure
              label="Total credits"
              value={result.totalCredits.toLocaleString()}
            />
            <SummaryFigure label="Total cost" value={formatUsd(result.totalCost)} />
            <SummaryFigure
              label="Provider cost / credit"
              value={formatUnitUsd(result.providerCostPerCredit)}
            />
            {pricing != null && (
              <>
                <SummaryFigure
                  label="Total revenue"
                  value={
                    pricing.totalRevenue == null
                      ? ABSENT
                      : formatUsd(pricing.totalRevenue)
                  }
                />
                <SummaryFigure
                  label="Total gross profit"
                  value={
                    pricing.totalGrossProfit == null
                      ? ABSENT
                      : formatUsd(pricing.totalGrossProfit)
                  }
                />
                <SummaryFigure
                  label="Gross margin"
                  value={formatPercent(pricing.grossMargin)}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryFigure({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex items-center gap-5">
      <p className="text-muted-foreground text-[0.6875rem] tracking-wide uppercase">
        {label}
      </p>
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ModelFigure({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex items-baseline gap-1">
      <dt>{label}</dt>
      <dd className="text-foreground font-mono font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function formatTokenLimit(tokenLimit: number): string {
  return `${new Intl.NumberFormat('en', {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(tokenLimit)} tokens`;
}

function getModelName(model: CreditAllocationModel): string {
  if (model.name != null) return model.name;

  const title = model.metadata?.['title'];
  if (typeof title === 'string') return title;

  const modelId = model.metadata?.['model'];
  return typeof modelId === 'string' ? modelId : 'Current model';
}
