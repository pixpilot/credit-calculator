import type { CreditUsageResult } from '@pixpilot/credit-usage-calculator';
import type { ReactNode } from 'react';

interface CreditCalculatorSummaryProps {
  result: CreditUsageResult;
}

/** Summarises used, remaining, and over-budget credits from the core result. */
export function CreditCalculatorSummary({
  result,
}: CreditCalculatorSummaryProps): ReactNode {
  return (
    <div className="border-border space-y-3 border-t pt-4">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Credits used</dt>
          <dd className="font-semibold">
            {result.usedCredits} / {result.totalCredits}
          </dd>
        </div>
        <div className="space-y-1 text-right">
          <dt className="text-muted-foreground">Remaining</dt>
          <dd className="font-semibold">{result.remainingCredits} credits</dd>
        </div>
      </dl>
      {!result.isWithinBudget && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm font-medium"
        >
          {result.overBudgetCredits} credits over your balance
        </p>
      )}
    </div>
  );
}
