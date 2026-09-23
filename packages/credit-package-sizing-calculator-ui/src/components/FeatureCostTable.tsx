'use client';

import type {
  CreditPricingFeature,
  CreditUsageMix,
} from '@pixpilot/credit-package-sizing-calculator';
import type { ReactNode } from 'react';

import { Button, Card, CardContent } from '@pixpilot/shadcn-ui';
import { Plus } from 'lucide-react';

import { useCreditPricingFormatters } from '../utils/format-context.tsx';
import { FeatureCostRow } from './FeatureCostRow.tsx';

const ICON_SIZE = 14;

export interface FeatureCostTableProps {
  features: readonly CreditPricingFeature[];
  mix: CreditUsageMix;
  onAdd: () => void;
  onChange: (featureId: string, changes: Partial<CreditPricingFeature>) => void;
  onRemove: (featureId: string) => void;
}

/**
 * Every credit-consuming feature, with what it costs and what it earns in
 * credits.
 *
 * The totals row is the pair of figures the whole pricing model rests on:
 * total direct cost over total credits is the weighted average cost per
 * credit, and seeing them added up under the rows that produced them is what
 * makes that figure checkable rather than asserted.
 */
export function FeatureCostTable({
  features,
  mix,
  onAdd,
  onChange,
  onRemove,
}: FeatureCostTableProps): ReactNode {
  const format = useCreditPricingFormatters();
  const featuresById = new Map(features.map((feature) => [feature.id, feature]));

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Feature costs</h3>
            <p className="text-muted-foreground text-xs">
              Expected runs describe one active user&apos;s month. Computed columns are
              not editable.
            </p>
          </div>
          <Button size="sm" type="button" variant="outline" onClick={onAdd}>
            <Plus aria-hidden="true" size={ICON_SIZE} />
            Add feature
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-4xl text-xs">
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="pr-2 pb-1 font-medium">Feature</th>
                <th className="pr-2 pb-1 font-medium">Credits / action</th>
                <th className="pr-2 pb-1 font-medium">Expected runs</th>
                <th className="pr-2 pb-1 font-medium">Input tokens</th>
                <th className="pr-2 pb-1 font-medium">Output tokens</th>
                <th className="pr-2 pb-1 font-medium">Fixed cost</th>
                <th className="pr-2 pb-1 text-right font-medium">Cost / action</th>
                <th className="pr-2 pb-1 text-right font-medium">Cost / credit</th>
                <th className="pr-2 pb-1 text-right font-medium">Total cost</th>
                <th className="pr-2 pb-1 text-right font-medium">Total credits</th>
                <th className="pb-1">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {mix.features.map((calculated) => {
                const feature = featuresById.get(calculated.id);

                return feature == null ? null : (
                  <FeatureCostRow
                    key={calculated.id}
                    calculated={calculated}
                    feature={feature}
                    onChange={(changes) => onChange(calculated.id, changes)}
                    onRemove={() => onRemove(calculated.id)}
                  />
                );
              })}
              {mix.features.length === 0 && (
                <tr className="border-border border-t">
                  <td className="text-muted-foreground py-3" colSpan={11}>
                    No features yet. Add one to price a credit against it.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-border border-t-2 font-medium">
                <td className="py-2 pr-2" colSpan={8}>
                  Expected totals
                </td>
                <td className="py-2 pr-2 text-right font-mono tabular-nums">
                  {format.money(mix.expectedTotalCost)}
                </td>
                <td className="py-2 pr-2 text-right font-mono tabular-nums" colSpan={2}>
                  {format.count(mix.expectedTotalCredits)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
