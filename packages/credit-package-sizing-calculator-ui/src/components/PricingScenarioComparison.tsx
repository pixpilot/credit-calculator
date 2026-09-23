'use client';

import type { CreditPricingSummary } from '@pixpilot/credit-package-sizing-calculator';
import type { ReactNode } from 'react';

import { creditPricingAssumptionsSchema } from '@pixpilot/credit-package-sizing-calculator';
import { Button, Card, CardContent } from '@pixpilot/shadcn-ui';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { useCreditPricingFormatters } from '../utils/format-context.tsx';
import { MarginStatusBadge } from './MarginStatusBadge.tsx';
import { NumberField } from './NumberField.tsx';

const ICON_SIZE = 14;
const MINIMUM = 0;
const SCENARIO_FIELD = creditPricingAssumptionsSchema.shape.scenarioCredits;

export interface PricingScenarioComparisonProps {
  onScenarioCreditsChange: (scenarioCredits: number[]) => void;
  summary: CreditPricingSummary;
}

/**
 * The same price, buying different numbers of credits.
 *
 * This is the fastest argument against generosity on the screen: the price
 * column never moves, so every extra credit a package includes comes straight
 * out of the margin beside it. Reading 500, 700 and 1,000 in a row is what
 * turns "we could give more" into a number.
 */
export function PricingScenarioComparison({
  onScenarioCreditsChange,
  summary,
}: PricingScenarioComparisonProps): ReactNode {
  const format = useCreditPricingFormatters();
  const { creditPackageIncrement, scenarioCredits } = summary.assumptions;
  const [draft, setDraft] = useState(summary.currentPackage.credits);

  const addScenario = (): void => {
    if (SCENARIO_FIELD.safeParse([...scenarioCredits, draft]).success) {
      onScenarioCreditsChange([...scenarioCredits, draft]);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">
              Package sizes at {format.money(summary.currentPackage.price)}
            </h3>
            <p className="text-muted-foreground text-xs">
              Same price, more credits: every row gives away margin the one above it kept.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <NumberField
              className="w-28 space-y-1"
              isValid={(value) => SCENARIO_FIELD.safeParse([value]).success}
              label="Add a size"
              min={MINIMUM}
              step={creditPackageIncrement}
              value={draft}
              onChange={setDraft}
            />
            <Button size="sm" type="button" variant="outline" onClick={addScenario}>
              <Plus aria-hidden="true" size={ICON_SIZE} />
              Add
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-2xl text-xs">
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="pr-2 pb-1 font-medium">Credits</th>
                <th className="pr-2 pb-1 text-right font-medium">Expected COGS</th>
                <th className="pr-2 pb-1 text-right font-medium">Worst-case COGS</th>
                <th className="pr-2 pb-1 text-right font-medium">Expected margin</th>
                <th className="pr-2 pb-1 text-right font-medium">Worst-case margin</th>
                <th className="pb-1">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.scenarios.map((scenario) => (
                <tr key={scenario.economics.credits} className="border-border border-t">
                  <td className="py-2 pr-2 font-mono tabular-nums">
                    {format.count(scenario.economics.credits)}
                    {scenario.isCurrent && (
                      <span className="text-muted-foreground ml-2 font-sans">
                        current
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-right font-mono tabular-nums">
                    {format.money(scenario.economics.expectedCost)}
                  </td>
                  <td className="py-2 pr-2 text-right font-mono tabular-nums">
                    {format.money(scenario.economics.worstCaseCost)}
                  </td>
                  <td className="py-2 pr-2 text-right font-mono tabular-nums">
                    {format.percent(scenario.economics.expectedGrossMarginPercent)}
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <span className="flex items-center justify-end gap-2">
                      <span className="font-mono tabular-nums">
                        {format.percent(scenario.economics.worstCaseGrossMarginPercent)}
                      </span>
                      <MarginStatusBadge
                        status={scenario.economics.worstCaseMarginStatus}
                      />
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      aria-label={`Remove the ${scenario.economics.credits} credit scenario`}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        onScenarioCreditsChange(
                          scenarioCredits.filter(
                            (credits) => credits !== scenario.economics.credits,
                          ),
                        )
                      }
                    >
                      <X aria-hidden="true" size={ICON_SIZE} />
                    </Button>
                  </td>
                </tr>
              ))}
              {summary.scenarios.length === 0 && (
                <tr className="border-border border-t">
                  <td className="text-muted-foreground py-3" colSpan={6}>
                    No sizes to compare. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
