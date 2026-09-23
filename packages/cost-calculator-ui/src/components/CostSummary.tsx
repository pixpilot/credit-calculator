'use client';

import type { CostBatch, CostCalculatorResult } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@pixpilot/shadcn-ui';
import { formatUsd } from '../utils/format-usd.ts';
import { CompactSummaryFeatureRow } from './CompactSummaryFeatureRow.tsx';
import { FeatureSettingsPopover } from './FeatureSettingsPopover.tsx';

/** Feature and quantity columns sit left of the total, plus settings when shown. */
const GRAND_TOTAL_LABEL_COLUMNS = 2;
const GRAND_TOTAL_LABEL_COLUMNS_WITH_SETTINGS = 3;

export interface CostSummaryProps {
  compact?: boolean | undefined;
  result: CostCalculatorResult;
  /** Input batches behind each row's settings popover. */
  value?: CostBatch[] | undefined;
  onBatchChange?: ((batchIndex: number, batch: CostBatch) => void) | undefined;
  onQuantityChange?: ((batchIndex: number, quantity: number) => void) | undefined;
}

/** Shows the batch rollup and exact grand total supplied by the core calculator. */
export function CostSummary({
  compact = false,
  onBatchChange,
  onQuantityChange,
  result,
  value,
}: CostSummaryProps): ReactNode {
  const showSettings = value != null && onBatchChange != null;
  const grandTotalColumns = showSettings
    ? GRAND_TOTAL_LABEL_COLUMNS_WITH_SETTINGS
    : GRAND_TOTAL_LABEL_COLUMNS;

  return (
    <Card>
      {!compact && (
        <CardHeader>
          <CardTitle className="text-base">Cost summary</CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? 'py-3' : 'space-y-3'}>
        {compact && onQuantityChange != null ? (
          <table className="w-full table-fixed text-xs">
            <colgroup>
              <col className="w-1/3" />
              {showSettings && <col className="w-8" />}
              <col />
              <col className="w-28" />
            </colgroup>
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="pr-3 pb-1 font-medium">Feature</th>
                {showSettings && (
                  <th className="w-8 pr-1 pb-1 font-medium">
                    <span className="sr-only">Settings</span>
                  </th>
                )}
                <th className="pr-3 pb-1 font-medium">Quantity</th>

                <th className="pb-1 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {result.batches.map((batch, index) => {
                const inputBatch = value?.[index];

                return (
                  <CompactSummaryFeatureRow
                    key={batch.name}
                    batch={batch}
                    settings={
                      value != null && onBatchChange != null && inputBatch != null ? (
                        <FeatureSettingsPopover
                          batch={inputBatch}
                          result={batch}
                          onChange={(nextBatch) => onBatchChange(index, nextBatch)}
                        />
                      ) : undefined
                    }
                    onQuantityChange={(quantity) => onQuantityChange(index, quantity)}
                  />
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <th className="pt-2 text-left" colSpan={grandTotalColumns}>
                  Grand total
                </th>
                <td className="pt-2 text-right font-mono tabular-nums">
                  {formatUsd(result.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <>
            {result.batches.map((batch) => (
              <div
                key={`${batch.name}-${batch.quantity}`}
                className="flex justify-between gap-6 text-sm"
              >
                <span className="text-muted-foreground">
                  {batch.name} × {batch.quantity.toLocaleString()}
                </span>
                <span className="font-mono tabular-nums">
                  {formatUsd(batch.totalCost)}
                </span>
              </div>
            ))}
            <div className="flex justify-between gap-6 border-t pt-2 font-medium">
              <span>Grand total</span>
              <span className="font-mono tabular-nums">
                {formatUsd(result.grandTotal)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
