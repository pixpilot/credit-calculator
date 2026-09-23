'use client';

import type { Money } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import type { CreditPricingFormat } from './format.ts';

import { createContext, use, useMemo } from 'react';
import {
  DEFAULT_FORMAT,
  formatCount,
  formatCreditLimit,
  formatMoney,
  formatPercent,
  formatUnitMoney,
} from './format.ts';

/**
 * The one place the calculator's screens agree on how a figure is written.
 *
 * Every panel formats money, percentages and counts, and a screen where two of
 * them round differently reads as two different calculations. Holding the
 * format in context rather than threading it through six components also means
 * pricing in another currency is a prop on the calculator, not an edit to
 * every card that shows an amount.
 */

/** The formatters every panel reads its figures through. */
export interface CreditPricingFormatters {
  count: (value: number | null | undefined, maximumFractionDigits?: number) => string;
  creditLimit: (credits: number | null | undefined) => string;
  money: (money: Money | null | undefined) => string;
  percent: (percent: number | null | undefined) => string;
  unitMoney: (money: Money | null | undefined) => string;
}

const CreditPricingFormatContext = createContext<CreditPricingFormat>(DEFAULT_FORMAT);

export interface CreditPricingFormatProviderProps {
  children: ReactNode;
  format?: CreditPricingFormat | undefined;
}

export function CreditPricingFormatProvider({
  children,
  format = DEFAULT_FORMAT,
}: CreditPricingFormatProviderProps): ReactNode {
  return (
    <CreditPricingFormatContext value={format}>{children}</CreditPricingFormatContext>
  );
}

/** The formatters bound to the format the surrounding calculator was given. */
export function useCreditPricingFormatters(): CreditPricingFormatters {
  const format = use(CreditPricingFormatContext);

  return useMemo(
    () => ({
      count: (value, maximumFractionDigits) =>
        formatCount(value, format, maximumFractionDigits),
      creditLimit: (credits) => formatCreditLimit(credits, format),
      money: (money) => formatMoney(money, format),
      percent: (percent) => formatPercent(percent, format),
      unitMoney: (money) => formatUnitMoney(money, format),
    }),
    [format],
  );
}
