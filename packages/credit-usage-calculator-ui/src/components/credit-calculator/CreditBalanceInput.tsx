import type { ReactNode } from 'react';
import { Input, Label } from '@pixpilot/shadcn';

/**
 * Far past any balance anyone holds, and stated rather than left open: an
 * unbounded number field reports no range to a screen reader, and a pasted
 * figure of any size would hand the sliders a track of that many steps.
 */
const MAX_CREDIT_BALANCE = 1_000_000;

interface CreditBalanceInputProps {
  credits: number;
  onCreditsChange: (credits: number) => void;
}

/**
 * The balance every slider on the calculator is measured against.
 *
 * Editable, because the question the calculator answers is "how far would my
 * credits go?" — and whose credits that is only the visitor knows. It sits
 * beside the view selector as the calculator's other setting rather than above
 * the sliders, where it would read as one more quantity to spend.
 */
export function CreditBalanceInput({
  credits,
  onCreditsChange,
}: CreditBalanceInputProps): ReactNode {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Label htmlFor="credit-calculator-balance" className="text-sm font-medium">
        Credits
      </Label>
      <Input
        id="credit-calculator-balance"
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_CREDIT_BALANCE}
        step={1}
        value={credits}
        className="w-full sm:w-32"
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);

          // An emptied field is a balance of nothing, not a stuck number: the
          // sliders collapse to zero and the visitor can type the figure they
          // meant. Anything unparseable is the same empty state.
          onCreditsChange(
            Number.isNaN(next) ? 0 : Math.min(Math.max(0, next), MAX_CREDIT_BALANCE),
          );
        }}
      />
    </div>
  );
}
