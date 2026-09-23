import { toDecimalString, toScaledInteger } from './decimal.ts';

/**
 * Percentages held as exact whole micro-percent, so a margin or a buffer never
 * reaches the money arithmetic as a float.
 *
 * One micro-percent is 1e-6 of a percent — finer than any figure an
 * administrator types, and coarse enough that every factor derived from it
 * stays a safe integer, which is the only kind `multiplyMoney` and
 * `divideMoney` accept.
 */

const MICRO_PERCENT_PLACES = 6;
const MICRO_PERCENT_PER_PERCENT = 1_000_000;
const PERCENT_IN_ONE = 100;
const ZERO = 0n;
const ROUNDING_DIVISOR = 2n;
const NEGATIVE = -1n;

/** A whole — 100% — expressed in micro-percent. */
export const ONE_IN_MICRO_PERCENT = PERCENT_IN_ONE * MICRO_PERCENT_PER_PERCENT;

/** Converts a validated non-negative percentage into whole micro-percent. */
export function toMicroPercent(percent: number): number {
  return Number(toScaledInteger(toDecimalString(percent), MICRO_PERCENT_PLACES));
}

/** Restates whole micro-percent as the percentage a caller reads. */
export function toPercent(microPercent: number): number {
  return microPercent / MICRO_PERCENT_PER_PERCENT;
}

/**
 * Expresses one exact quantity as a percentage of another, rounding half away
 * from zero at micro-percent.
 *
 * The ratio is taken in `bigint` because both sides are atomic money units:
 * turning them into floats first is what would make a margin read as
 * `79.99999999999999`.
 */
export function ratioToMicroPercent(numerator: bigint, denominator: bigint): number {
  const scaled = numerator * BigInt(ONE_IN_MICRO_PERCENT) * ROUNDING_DIVISOR;
  const bias = numerator < ZERO ? denominator * NEGATIVE : denominator;

  return Number((scaled + bias) / (denominator * ROUNDING_DIVISOR));
}
