'use client';

import type {
  CreditPricingFeature,
  CreditPricingResult,
} from '@pixpilot/credit-pricing-calculator';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@pixpilot/shadcn-ui';
import { CreditPricingRow } from './CreditPricingRow.tsx';

export interface CreditPricingTableProps {
  result: CreditPricingResult;
  onFeatureChange: (featureId: string, changes: Partial<CreditPricingFeature>) => void;
  /** `false` when the host derives each provider cost and owns it. */
  providerCostEditable?: boolean | undefined;
}

/**
 * The editor and the calculation result in one table.
 *
 * Each row carries the feature's two editable figures and the per-credit cost
 * they produce, so there is no second results table to scroll to when an
 * administrator wants to see what an edit did.
 */
export function CreditPricingTable({
  onFeatureChange,
  providerCostEditable,
  result,
}: CreditPricingTableProps): ReactNode {
  return (
    <Card>
      <CardContent className="py-3">
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-40" />
            <col className="w-28" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-24" />
          </colgroup>
          <thead className="text-muted-foreground text-left">
            <tr>
              <th className="pr-3 pb-1 font-medium">Feature</th>
              <th className="pr-3 pb-1 font-medium">Provider cost / execution</th>
              <th className="pr-3 pb-1 font-medium">Credits / execution</th>
              <th className="pr-3 pb-1 text-right font-medium">Provider cost / credit</th>
              <th className="pb-1 text-right font-medium">Margin at price</th>
            </tr>
          </thead>
          <tbody>
            {result.features.map((feature) => (
              <CreditPricingRow
                key={feature.id}
                feature={feature}
                providerCostEditable={providerCostEditable}
                onChange={(changes) => onFeatureChange(feature.id, changes)}
              />
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
