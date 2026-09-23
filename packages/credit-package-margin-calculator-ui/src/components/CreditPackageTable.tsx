'use client';

import type {
  CreditPackagePricingResult,
  PackageRow,
} from '@pixpilot/credit-package-margin-calculator';
import type { ReactNode } from 'react';

import { Button } from '@pixpilot/shadcn';
import { Plus } from 'lucide-react';
import { formatPercent } from '../utils/format-number.ts';
import { CalculatorSection } from './CalculatorSection.tsx';
import { CreditPackageRow } from './CreditPackageRow.tsx';

const HEADINGS = [
  'Price',
  'Credits',
  'Fee',
  'Net',
  'Blended margin',
  'Worst-case margin',
  'Credits @ target (blended)',
  'Credits @ target (worst)',
] as const;

export interface CreditPackageTableProps {
  result: CreditPackagePricingResult;
  onAddPackage: () => void;
  onPackageChange: (packageId: string, changes: Partial<PackageRow>) => void;
  onRemovePackage: (packageId: string) => void;
}

/**
 * Every pack on sale, measured against both costs per credit.
 *
 * The last two columns answer the question the margins raise: given the target
 * margin, how many credits could this price actually carry? The blended figure
 * is what the current usage mix supports; the worst-case figure is what it
 * supports if a user spends the lot on the dearest feature.
 */
export function CreditPackageTable({
  onAddPackage,
  onPackageChange,
  onRemovePackage,
  result,
}: CreditPackageTableProps): ReactNode {
  return (
    <CalculatorSection
      scrollable
      action={
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-mono text-[0.6875rem] tabular-nums">
            target {formatPercent(result.settings.targetMargin)}
          </span>
          <Button
            className="h-7 rounded-none text-xs"
            size="sm"
            type="button"
            variant="ghost"
            onClick={onAddPackage}
          >
            <Plus className="size-3.5" />
            Add package
          </Button>
        </div>
      }
      title="Credit packages"
    >
      <table aria-label="Credit packages" className="w-full min-w-[52rem] text-xs">
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
          {result.packages.map((row) => (
            <CreditPackageRow
              key={row.packageRow.id}
              row={row}
              onChange={(changes) => {
                onPackageChange(row.packageRow.id, changes);
              }}
              onRemove={() => {
                onRemovePackage(row.packageRow.id);
              }}
            />
          ))}
        </tbody>
      </table>
    </CalculatorSection>
  );
}
