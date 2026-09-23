import type { Money } from '@pixpilot/cost-calculator';

import { divideMoney, multiplyMoney } from '@pixpilot/cost-calculator';

import { toDecimalString, toScaledInteger } from './decimal.ts';

/**
 * The reading and ordering of exact amounts that `@pixpilot/cost-calculator`
 * does not export.
 *
 * Every amount this package produces is still calculated by that package's
 * exact `bigint` arithmetic — `multiplyMoney` and `divideMoney`. What lives
 * here is only what is needed to read an amount, to put two of them in order,
 * and to ask whether one is zero. None of it re-implements money arithmetic,
 * and none of it builds a float on the way.
 */

/** The precision `@pixpilot/cost-calculator` keeps its amounts at. */
const DECIMAL_PLACES = 30;
const NO_ATOMIC_USD = 0n;
const CARRY = 1n;
const NO_CARRY = 0n;

/** A decimal amount, with an optional fraction and no sign or exponent. */
const DECIMAL_AMOUNT = /^\d+(?:\.\d+)?$/u;

/** True when a string is an exact, non-negative amount this module can read. */
export function isDecimalAmount(value: string): boolean {
  return DECIMAL_AMOUNT.test(value);
}

/** Reads a provider cost supplied as either an exact amount or a number. */
export function toMoney(value: Money | number): Money {
  if (typeof value !== 'number') return value;

  return { amount: toDecimalString(value), currency: 'USD' };
}

/** Reads an exact amount as the atomic units the arithmetic is carried in. */
export function toAtomicUsd(money: Money): bigint {
  return toScaledInteger(money.amount, DECIMAL_PLACES);
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
  return toAtomicUsd(money) === NO_ATOMIC_USD;
}

/**
 * Scales an exact amount by a ratio of two whole numbers.
 *
 * A margin and a buffer are ratios, not divisors, so applying one is a
 * multiplication and a division — both carried out by
 * `@pixpilot/cost-calculator` in atomic `bigint` units, with the single
 * rounding `divideMoney` performs at the precision the rest of the calculator
 * keeps.
 */
export function scaleMoney(money: Money, numerator: number, denominator: number): Money {
  return divideMoney(multiplyMoney(money, numerator), denominator);
}

/**
 * Rounds an exact amount up to a given number of decimal places.
 *
 * Always up, never to nearest: this is how a calculated threshold becomes a
 * price that may be charged, and a price rounded down is one that misses the
 * margin it was calculated for.
 */
export function roundUpMoney(money: Money, places: number): Money {
  const [whole = '0', fraction = ''] = money.amount.split('.');
  const kept = fraction.slice(0, places).padEnd(places, '0');
  const shouldRoundUp = /[1-9]/u.test(fraction.slice(places));
  const scaled = (BigInt(`${whole}${kept}`) + (shouldRoundUp ? CARRY : NO_CARRY))
    .toString()
    .padStart(places + 1, '0');

  return {
    amount:
      places === 0
        ? scaled
        : `${scaled.slice(0, scaled.length - places)}.${scaled.slice(scaled.length - places)}`,
    currency: 'USD',
  };
}
