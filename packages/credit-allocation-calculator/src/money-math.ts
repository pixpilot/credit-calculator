import type { Money } from '@pixpilot/cost-calculator';

import type { Ratio } from './types.ts';

/**
 * The two pieces of exact money arithmetic pricing needs and a provider cost
 * never does.
 *
 * `@pixpilot/cost-calculator` owns this calculator's money layer, but its
 * helpers cover only the shapes a cost has: non-negative amounts, divided into
 * a whole number of parts. Profit is a difference that goes negative when an
 * operation is sold below cost, and a margin is one amount divided into
 * another. Both are derived here at the same 30-decimal scale, rounded half up
 * exactly as `divideMoney` rounds, rather than on floats.
 */

const DECIMAL_PLACES = 30;
const USD_SCALE = 10n ** BigInt(DECIMAL_PLACES);
const ROUNDING_DIVISOR = 2n;
const NOTHING = 0n;

/** Subtracts exact amounts, keeping a loss as the negative amount it is. */
export function subtractMoney(minuend: Money, subtrahend: Money): Money {
  return {
    amount: toDecimal(toScaled(minuend.amount) - toScaled(subtrahend.amount)),
    currency: 'USD',
  };
}

/**
 * Divides one exact amount into another.
 *
 * `null` when there is nothing to divide by, so an undefined margin reaches
 * the screen as "not applicable" rather than as `0`, `NaN`, or `Infinity`.
 */
export function divideMoneyIntoRatio(numerator: Money, denominator: Money): Ratio | null {
  const denominatorScaled = toScaled(denominator.amount);

  if (denominatorScaled === NOTHING) return null;

  const numeratorScaled = toScaled(numerator.amount);
  const isNegative = numeratorScaled < NOTHING !== denominatorScaled < NOTHING;
  const magnitude = divideHalfUp(
    absolute(numeratorScaled) * USD_SCALE,
    absolute(denominatorScaled),
  );

  return { value: toDecimal(isNegative ? -magnitude : magnitude) };
}

/** Reads a decimal string as exact scaled units, sign included. */
function toScaled(decimal: string): bigint {
  const isNegative = decimal.startsWith('-');
  const [whole = '0', fraction = ''] = (isNegative ? decimal.slice(1) : decimal).split(
    '.',
  );
  const scaled =
    BigInt(whole) * USD_SCALE +
    BigInt(fraction.slice(0, DECIMAL_PLACES).padEnd(DECIMAL_PLACES, '0'));

  return isNegative ? -scaled : scaled;
}

/** Renders exact scaled units back as a decimal string, sign included. */
function toDecimal(scaled: bigint): string {
  const isNegative = scaled < NOTHING;
  const magnitude = absolute(scaled);
  const fraction = (magnitude % USD_SCALE)
    .toString()
    .padStart(DECIMAL_PLACES, '0')
    .replace(/0+$/u, '');
  const whole = (magnitude / USD_SCALE).toString();
  const decimal = fraction.length > 0 ? `${whole}.${fraction}` : whole;

  return isNegative ? `-${decimal}` : decimal;
}

/** The half-up rule `divideMoney` rounds by, applied to a magnitude. */
function divideHalfUp(value: bigint, divisor: bigint): bigint {
  return (value * ROUNDING_DIVISOR + divisor) / (divisor * ROUNDING_DIVISOR);
}

function absolute(value: bigint): bigint {
  return value < NOTHING ? -value : value;
}
