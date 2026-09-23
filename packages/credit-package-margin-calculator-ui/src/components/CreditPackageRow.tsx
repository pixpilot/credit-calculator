'use client';

import type {
  CalculatedPackageRow,
  MarginStatus,
  PackageRow,
} from '@pixpilot/credit-package-margin-calculator';
import type { ReactNode } from 'react';

import { MAX_CREDITS, MAX_USD_AMOUNT } from '@pixpilot/credit-package-margin-calculator';
import { Button, cn } from '@pixpilot/shadcn';
import { X } from 'lucide-react';
import { formatCount, formatPercent, formatUsd } from '../utils/format-number.ts';
import { marginTone } from '../utils/margin-tone.ts';
import { NumericCell } from './NumericCell.tsx';

const PRICE_STEP = 0.5;

export interface CreditPackageRowProps {
  row: CalculatedPackageRow;
  onChange: (changes: Partial<PackageRow>) => void;
  onRemove: () => void;
}

/** One pack: its price and credits, and what the two costs per credit leave on it. */
export function CreditPackageRow({
  onChange,
  onRemove,
  row,
}: CreditPackageRowProps): ReactNode {
  const { packageRow } = row;
  const packageLabel = `${formatUsd(packageRow.price)} package`;

  return (
    <tr className="border-border/60 border-t">
      <td className="w-28 py-1 pr-2 pl-3">
        <NumericCell
          label={`Price for the ${packageLabel}`}
          maximum={MAX_USD_AMOUNT}
          step={PRICE_STEP}
          value={packageRow.price}
          onCommit={(price) => {
            onChange({ price });
          }}
        />
      </td>

      <td className="w-28 py-1 pr-2">
        <NumericCell
          integer
          label={`Credits in the ${packageLabel}`}
          maximum={MAX_CREDITS}
          value={packageRow.credits}
          onCommit={(credits) => {
            onChange({ credits });
          }}
        />
      </td>

      <Readout>{formatUsd(row.stripeFee)}</Readout>
      <Readout>{formatUsd(row.netRevenue)}</Readout>

      <MarginCell margin={row.blendedMargin} status={row.blendedStatus} />
      <MarginCell margin={row.worstMargin} status={row.worstStatus} />

      <Readout>{formatCount(row.suggestedCreditsBlended)}</Readout>
      <Readout>{formatCount(row.suggestedCreditsWorst)}</Readout>

      <td className="py-1 pr-2 pl-1">
        <Button
          aria-label={`Remove the ${packageLabel}`}
          className="size-7 rounded-none"
          size="icon"
          type="button"
          variant="ghost"
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
}

/**
 * A margin, coloured and named.
 *
 * The status is spelled out under the figure rather than left to the colour
 * alone, so the table still says which margins are in trouble in greyscale, in
 * a screenshot, and to a reader who cannot separate red from green.
 */
function MarginCell({
  margin,
  status,
}: {
  margin: number | null;
  status: MarginStatus;
}): ReactNode {
  const tone = marginTone(status);

  return (
    <td className="py-1 pr-3 text-right whitespace-nowrap">
      <span className={cn('block font-mono text-xs tabular-nums', tone.className)}>
        {formatPercent(margin)}
      </span>
      <span className="text-muted-foreground block text-[0.625rem]">{tone.label}</span>
    </td>
  );
}

function Readout({ children }: { children: ReactNode }): ReactNode {
  return (
    <td className="py-1 pr-3 text-right font-mono text-xs whitespace-nowrap tabular-nums">
      {children}
    </td>
  );
}
