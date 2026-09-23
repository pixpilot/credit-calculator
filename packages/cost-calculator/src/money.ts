import type { Money } from './types.ts';

const DECIMAL_PLACES = 30;
const ONE_ATOMIC_USD = 1n;
const ROUNDING_DIVISOR = 2n;
const TEN = 10n;
const TOKENS_PER_MILLION = 1_000_000n;
const USD_SCALE = TEN ** BigInt(DECIMAL_PLACES);
const ZERO_ATOMIC_USD = 0n;

type AtomicUsd = bigint;

/** Converts a validated decimal USD number into exact atomic USD units. */
export function usdNumberToAtomic(value: number): AtomicUsd {
  const decimal = expandScientificNotation(value.toString());
  const [whole = '0', fraction = ''] = decimal.split('.');
  const retainedFraction = fraction.slice(0, DECIMAL_PLACES).padEnd(DECIMAL_PLACES, '0');
  const nextDigit = fraction.charAt(DECIMAL_PLACES);
  const roundedFraction =
    BigInt(retainedFraction) + (nextDigit >= '5' ? ONE_ATOMIC_USD : ZERO_ATOMIC_USD);

  return BigInt(whole) * USD_SCALE + roundedFraction;
}

/** Calculates one side of a token-priced operation in atomic USD units. */
export function tokenCostToAtomic(
  pricePerMillionTokens: number,
  tokens: number,
): AtomicUsd {
  return divideAndRoundHalfUp(usdNumberToAtomic(pricePerMillionTokens) * BigInt(tokens));
}

/** Converts atomic USD units into a stable, display-ready currency value. */
export function atomicToMoney(value: AtomicUsd): Money {
  const whole = value / USD_SCALE;
  const fraction = (value % USD_SCALE)
    .toString()
    .padStart(DECIMAL_PLACES, '0')
    .replace(/0+$/u, '');

  return {
    amount: fraction.length > 0 ? `${whole}.${fraction}` : whole.toString(),
    currency: 'USD',
  };
}

/** Multiplies an atomic USD amount by a validated execution quantity. */
export function multiplyAtomic(value: AtomicUsd, quantity: number): AtomicUsd {
  return value * BigInt(quantity);
}

function divideAndRoundHalfUp(numerator: AtomicUsd): AtomicUsd {
  return (numerator + TOKENS_PER_MILLION / ROUNDING_DIVISOR) / TOKENS_PER_MILLION;
}

function expandScientificNotation(value: string): string {
  if (!value.includes('e')) return value;

  const [coefficient, exponentValue] = value.toLowerCase().split('e');
  const exponent = Number(exponentValue);
  const [whole, fraction = ''] = coefficient!.split('.');
  const digits = `${whole}${fraction}`;
  const decimalPosition = whole!.length + exponent;

  if (decimalPosition <= 0) {
    return `0.${'0'.repeat(-decimalPosition)}${digits}`;
  }

  if (decimalPosition >= digits.length) {
    return `${digits}${'0'.repeat(decimalPosition - digits.length)}`;
  }

  return `${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`;
}

/** Parses a `Money` produced by this module back into exact atomic units. */
export function moneyToAtomic(money: Money): AtomicUsd {
  const [whole = '0', fraction = ''] = money.amount.split('.');
  const retainedFraction = fraction.slice(0, DECIMAL_PLACES).padEnd(DECIMAL_PLACES, '0');

  return BigInt(whole) * USD_SCALE + BigInt(retainedFraction);
}

/** Splits an atomic USD amount into equal parts, rounding half up. */
export function divideAtomic(value: AtomicUsd, divisor: bigint): AtomicUsd {
  return (value * ROUNDING_DIVISOR + divisor) / (divisor * ROUNDING_DIVISOR);
}
