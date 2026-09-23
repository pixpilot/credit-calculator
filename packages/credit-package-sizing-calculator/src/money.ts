import type { Money } from '@pixpilot/cost-calculator';

import { fromScaledInteger, toDecimalString, toScaledInteger } from './decimal.ts';

/**
 * Exact money arithmetic for a calculator whose figures routinely sit below a
 * cent.
 *
 * `@pixpilot/cost-calculator` owns the shape of an amount and the scale it is
 * kept at, and its helpers cover the arithmetic a *cost* needs: non-negative
 * amounts, repeated or split a whole number of times. Pricing needs three more
 * things a cost never does — a profit that goes negative when credits are sold
 * below cost, an amount scaled by a percentage rather than a whole number, and
 * one amount divided into another to get a count of credits. Those are derived
 * here, at the same 30-decimal scale and with the same half-up rounding, so a
 * figure this module produces is the one `divideMoney` would have produced.
 *
 * Nothing here builds a float on the way. A cost per credit of `$0.0008404` is
 * an ordinary figure on this screen, and floating point is what turns it into
 * a margin of `79.99999999999999%`.
 */

/** The precision `@pixpilot/cost-calculator` keeps its amounts at. */
const DECIMAL_PLACES = 30;
const ROUNDING_DIVISOR = 2n;
const NOTHING = 0n;
/** Enough decimal places to read a ratio back as an exact-looking number. */
const RATIO_PLACES = 12;

/** A decimal amount, with an optional sign and fraction but no exponent. */
const DECIMAL_AMOUNT = /^-?\d+(?:\.\d+)?$/u;

/** The canonical zero amount, so callers never rebuild one from a float. */
export const ZERO_USD: Money = { amount: '0', currency: 'USD' };

/** True when a string is an exact decimal amount this module can read. */
export function isDecimalAmount(value: string): boolean {
  return DECIMAL_AMOUNT.test(value);
}

/** Reads a figure supplied as either an exact amount or a plain number. */
export function toMoney(value: Money | number): Money {
  if (typeof value !== 'number') return value;

  return { amount: toDecimalString(value), currency: 'USD' };
}

/** Reads an exact amount as the atomic units the arithmetic is carried in. */
export function toAtomicUsd(money: Money): bigint {
  return toScaledInteger(money.amount, DECIMAL_PLACES);
}

/** Renders atomic units back as an exact amount, sign included. */
export function fromAtomicUsd(atomic: bigint): Money {
  return { amount: fromScaledInteger(atomic, DECIMAL_PLACES), currency: 'USD' };
}

/** Adds exact amounts, so a total is never accumulated through a float. */
export function addMoney(amounts: readonly Money[]): Money {
  return fromAtomicUsd(
    amounts.reduce((total, money) => total + toAtomicUsd(money), NOTHING),
  );
}

/** Subtracts exact amounts, keeping a loss as the negative amount it is. */
export function subtractMoney(minuend: Money, subtrahend: Money): Money {
  return fromAtomicUsd(toAtomicUsd(minuend) - toAtomicUsd(subtrahend));
}

/**
 * Scales an exact amount by a ratio of two whole numbers.
 *
 * A margin, a buffer, and a per-million token price are all ratios rather than
 * divisors, so applying one is a multiplication and a division carried out in
 * atomic units with a single half-up rounding at the end.
 */
export function scaleMoney(money: Money, numerator: bigint, denominator: bigint): Money {
  if (denominator === NOTHING) throw new Error('Money cannot be scaled by zero');

  return fromAtomicUsd(divideHalfUp(toAtomicUsd(money) * numerator, denominator));
}

/** Repeats an exact amount a whole number of times. */
export function multiplyMoneyByCount(money: Money, count: number): Money {
  return fromAtomicUsd(toAtomicUsd(money) * BigInt(count));
}

/** Splits an exact amount into a whole number of equal parts. */
export function divideMoneyByCount(money: Money, count: number): Money {
  return scaleMoney(money, 1n, BigInt(count));
}

/**
 * Divides one exact amount into another and reads the result as a plain count.
 *
 * This is the one place a number leaves the exact layer, and it is deliberate:
 * the answer is "how many credits", not an amount of money, and a credit count
 * is something the screen rounds to a package increment anyway. `null` when
 * there is nothing to divide by, so an undefined limit reaches the screen as
 * "not applicable" rather than as `Infinity`.
 */
export function divideMoneyToCount(numerator: Money, denominator: Money): number | null {
  const denominatorAtomic = toAtomicUsd(denominator);

  if (denominatorAtomic === NOTHING) return null;

  const scaled = divideHalfUp(
    toAtomicUsd(numerator) * 10n ** BigInt(RATIO_PLACES),
    denominatorAtomic,
  );

  return Number(fromScaledInteger(scaled, RATIO_PLACES));
}

/** Orders two exact amounts, so the largest can be picked without a float. */
export function compareMoney(first: Money, second: Money): number {
  const firstAtomic = toAtomicUsd(first);
  const secondAtomic = toAtomicUsd(second);

  if (firstAtomic === secondAtomic) return 0;

  return firstAtomic > secondAtomic ? 1 : -1;
}

/** True when an exact amount is nothing at all, however it is written. */
export function isZeroMoney(money: Money): boolean {
  return toAtomicUsd(money) === NOTHING;
}

/** Half-up rounding on a magnitude or a signed value, matching `divideMoney`. */
function divideHalfUp(value: bigint, divisor: bigint): bigint {
  const isNegative = value < NOTHING !== divisor < NOTHING;
  const magnitude = absolute(value);
  const magnitudeDivisor = absolute(divisor);
  const rounded =
    (magnitude * ROUNDING_DIVISOR + magnitudeDivisor) /
    (magnitudeDivisor * ROUNDING_DIVISOR);

  return isNegative ? -rounded : rounded;
}

function absolute(value: bigint): bigint {
  return value < NOTHING ? -value : value;
}
