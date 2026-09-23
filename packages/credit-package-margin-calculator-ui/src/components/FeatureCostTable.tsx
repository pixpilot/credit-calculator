'use client';

import type {
  CreditPackagePricingResult,
  FeatureRow,
} from '@pixpilot/credit-package-margin-calculator';
import type { ReactNode } from 'react';

import { Button } from '@pixpilot/shadcn';
import { Plus } from 'lucide-react';
import { formatCount, formatUsd } from '../utils/format-number.ts';
import { CalculatorSection } from './CalculatorSection.tsx';
import { FeatureCostRow } from './FeatureCostRow.tsx';

const HEADINGS = [
  'Feature',
  'Credits / run',
  'Input tok',
  'Output tok',
  'Fixed $',
  'Runs / mo',
  '$ / run',
  '$ / credit',
  'Total cost',
  'Total credits',
] as const;

/** The two columns the footer totals: total cost and total credits. */
const TOTALLED_COLUMNS = 2;

export interface FeatureCostTableProps {
  result: CreditPackagePricingResult;
  onAddFeature: () => void;
  onFeatureChange: (featureId: string, changes: Partial<FeatureRow>) => void;
  onRemoveFeature: (featureId: string) => void;
}

/** Every credit-charging feature, as edited and as costed, with the month's totals. */
export function FeatureCostTable({
  onAddFeature,
  onFeatureChange,
  onRemoveFeature,
  result,
}: FeatureCostTableProps): ReactNode {
  return (
    <CalculatorSection
      scrollable
      action={
        <Button
          className="h-7 rounded-none text-xs"
          size="sm"
          type="button"
          variant="ghost"
          onClick={onAddFeature}
        >
          <Plus className="size-3.5" />
          Add feature
        </Button>
      }
      title="Feature costs"
    >
      <table aria-label="Feature costs" className="w-full min-w-[60rem] text-xs">
        <thead className="text-muted-foreground">
          <tr>
            {HEADINGS.map((heading, headingIndex) => (
              <th
                key={heading}
                className={`px-2 py-2 text-[0.6875rem] font-medium tracking-[0.08em] whitespace-nowrap uppercase ${
                  headingIndex === 0 ? 'pl-3 text-left' : 'text-right'
                }`}
                scope="col"
              >
                {heading}
              </th>
            ))}
            <th className="w-9" scope="col">
              <span className="sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {result.features.map((row) => (
            <FeatureCostRow
              key={row.feature.id}
              row={row}
              onChange={(changes) => {
                onFeatureChange(row.feature.id, changes);
              }}
              onRemove={() => {
                onRemoveFeature(row.feature.id);
              }}
            />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-border border-t-2">
            <th
              className="py-2 pl-3 text-left text-[0.6875rem] tracking-[0.08em] uppercase"
              colSpan={HEADINGS.length - TOTALLED_COLUMNS}
              scope="row"
            >
              Total
            </th>
            <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums">
              {formatUsd(result.totalCost)}
            </td>
            <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums">
              {formatCount(result.totalCredits)}
            </td>
            <td aria-hidden="true" />
          </tr>
        </tfoot>
      </table>
    </CalculatorSection>
  );
}
