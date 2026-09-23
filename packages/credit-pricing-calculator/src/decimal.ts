/**
 * Reading numbers as their own exact decimal digits.
 *
 * Every figure an administrator supplies — a provider cost, a margin, a buffer
 * — arrives as a JavaScript number, and each one is on its way into arithmetic
 * that must not round. `Number.prototype.toString` already prints the shortest
 * decimal that identifies a value exactly; all this module adds is expanding
 * the exponent notation it uses for small amounts, so `5e-7` is read as
 * `0.0000005` rather than rejected or, worse, parsed as `5`.
 */

const ROUND_UP_DIGIT = '5';
const CARRY = 1n;
const NO_CARRY = 0n;

/** Prints a number as a plain decimal string, without exponent notation. */
export function toDecimalString(value: number): string {
  const printed = value.toString();

  if (!printed.includes('e')) return printed;

  const [coefficient = '', exponentValue = '0'] = printed.toLowerCase().split('e');
  const exponent = Number(exponentValue);
  const [whole = '', fraction = ''] = coefficient.split('.');
  const digits = `${whole}${fraction}`;
  const decimalPosition = whole.length + exponent;

  if (decimalPosition <= 0) return `0.${'0'.repeat(-decimalPosition)}${digits}`;
  if (decimalPosition >= digits.length) {
    return `${digits}${'0'.repeat(decimalPosition - digits.length)}`;
  }

  return `${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`;
}

/**
 * Scales a non-negative decimal string to a whole number of its own digits,
 * rounding half up at `places`.
 *
 * Multiplying by a power of ten is what the caller means, but not what it can
 * do: `12.3 * 1e6` is not `12_300_000` in binary floating point, and a rate
 * this calculator later divides by must not start out wrong.
 */
export function toScaledInteger(decimal: string, places: number): bigint {
  const [whole = '0', fraction = ''] = decimal.split('.');
  const kept = fraction.slice(0, places).padEnd(places, '0');
  const shouldRoundUp = fraction.charAt(places) >= ROUND_UP_DIGIT;

  return BigInt(`${whole}${kept}`) + (shouldRoundUp ? CARRY : NO_CARRY);
}
