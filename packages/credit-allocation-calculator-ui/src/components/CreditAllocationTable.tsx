'use client';

import type {
  CalculatedCreditPricingScenario,
  CreditAllocationResult,
} from '@pixpilot/credit-allocation-calculator';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@pixpilot/shadcn-ui';
import { formatPercent, formatUsd } from '../utils/format-money.ts';
import { CreditAllocationRow } from './CreditAllocationRow.tsx';

/** What the table shows where a figure is undefined, as the money helpers do. */
const ABSENT = '—';

export interface CreditAllocationTableProps {
  maxCreditsPerExecution: number;
  maxRuns: number;
  /** The selected scenario's economics, when the host supplied any pricing. */
  pricing?: CalculatedCreditPricingScenario | undefined;
  result: CreditAllocationResult;
  onCreditsChange: (operationId: string, creditsPerExecution: number) => void;
  onRunsChange: (operationId: string, runs: number) => void;
}

/**
 * The editor and calculation result in one table, with totals in its footer.
 *
 * The revenue and margin columns appear only while a pricing scenario is
 * selected. With no scenario there is no honest figure to put in them, and a
 * column of dashes would read as an allocation that earns nothing rather than
 * as one nobody has priced yet.
 */
export function CreditAllocationTable({
  maxCreditsPerExecution,
  maxRuns,
  onCreditsChange,
  onRunsChange,
  pricing,
  result,
}: CreditAllocationTableProps): ReactNode {
  return (
    <Card>
      <CardContent className="py-3">
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-40" />
            <col className="w-20" />
            <col />
            <col className="w-20" />
            <col className="w-28" />
            {pricing != null && <col className="w-28" />}
            {pricing != null && <col className="w-20" />}
          </colgroup>
          <thead className="text-muted-foreground text-left">
            <tr>
              <th className="pr-3 pb-1 font-medium">Operation</th>
              <th className="pr-3 pb-1 font-medium">Credits / run</th>
              <th className="pr-3 pb-1 font-medium">Runs</th>
              <th className="pr-3 pb-1 text-right font-medium">Credits</th>
              <th className="pr-3 pb-1 text-right font-medium">Cost</th>
              {pricing != null && (
                <>
                  <th className="pr-3 pb-1 text-right font-medium">Revenue</th>
                  <th className="pb-1 text-right font-medium">Margin</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {result.operations.map((operation, index) => (
              <CreditAllocationRow
                key={operation.id}
                maxCreditsPerExecution={maxCreditsPerExecution}
                maxRuns={maxRuns}
                operation={operation}
                pricing={pricing?.operations[index]}
                onCreditsChange={(credits) => onCreditsChange(operation.id, credits)}
                onRunsChange={(runs) => onRunsChange(operation.id, runs)}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <th className="pt-2 text-left">Total</th>
              <td />
              <td className="pt-2 pr-3 text-right font-mono tabular-nums">
                {result.totalRuns.toLocaleString()}
              </td>
              <td className="pt-2 pr-3 text-right font-mono tabular-nums">
                {result.totalCredits.toLocaleString()}
              </td>
              <td className="pt-2 pr-3 text-right font-mono tabular-nums">
                {formatUsd(result.totalCost)}
              </td>
              {pricing != null && (
                <>
                  <td className="pt-2 pr-3 text-right font-mono tabular-nums">
                    {pricing.totalRevenue == null
                      ? ABSENT
                      : formatUsd(pricing.totalRevenue)}
                  </td>
                  <td className="pt-2 text-right font-mono tabular-nums">
                    {formatPercent(pricing.grossMargin)}
                  </td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}
