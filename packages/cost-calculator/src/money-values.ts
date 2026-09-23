import type { Money } from './types.ts';

import { atomicToMoney, divideAtomic, moneyToAtomic, multiplyAtomic } from './money.ts';

const NO_ATOMIC_USD = 0n;

/** The canonical zero amount, so callers never rebuild one from a float. */
export const ZERO_USD: Money = { amount: '0', currency: 'USD' };

/**
 * Divides an exact amount into a whole number of equal parts, rounding half
 * up at the precision the rest of the calculator keeps.
 *
 * Sharing a cost across credits, executions, or seats is still money
 * arithmetic, so it stays here rather than being re-derived — on floats — by
 * every consumer that needs a per-unit rate.
 */
export function divideMoney(money: Money, divisor: number): Money {
  if (!Number.isSafeInteger(divisor) || divisor <= 0) {
    throw new Error('Money can only be divided by a positive whole number');
  }

  return atomicToMoney(divideAtomic(moneyToAtomic(money), BigInt(divisor)));
}

/**
 * Repeats an exact amount a whole number of times.
 *
 * This is how a per-execution cost becomes the cost of every execution, and it
 * gives exactly the figure `calculateCost` would produce for the same quantity
 * — the multiplication happens in `bigint` units, not on a rounded decimal.
 */
export function multiplyMoney(money: Money, quantity: number): Money {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error('Money can only be multiplied by a non-negative whole number');
  }

  return atomicToMoney(multiplyAtomic(moneyToAtomic(money), quantity));
}

/**
 * Adds exact amounts, so a total is never accumulated through a float.
 *
 * Summing in atomic units is what keeps a rollup equal to its own rows: no
 * intermediate value is rounded on the way to the total.
 */
export function sumMoney(amounts: readonly Money[]): Money {
  return atomicToMoney(
    amounts.reduce((total, money) => total + moneyToAtomic(money), NO_ATOMIC_USD),
  );
}
