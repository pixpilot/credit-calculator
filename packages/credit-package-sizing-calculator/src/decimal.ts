/**
 * Reading JavaScript numbers as their own exact decimal digits.
 *
 * Every figure this calculator is given — a token price, a package price, a
 * margin — arrives as a number and is on its way into arithmetic that must not
 * round. `Number.prototype.toString` already prints the shortest decimal that
 * identifies a value exactly; all this module adds is expanding the exponent
 * notation it uses for small amounts, so a fixed cost of `2e-6` is read as
 * `0.000002` rather than as `2`.
 */

const ROUND_UP_DIGIT = '5';
const CARRY = 1n;
const NO_CARRY = 0n;
const NEGATIVE_SIGN = '-';

/** Prints a number as a plain decimal string, without exponent notation. */
export function toDecimalString(value: number): string {
  const printed = value.toString();

  if (!printed.includes('e')) return printed;

  const isNegative = printed.startsWith(NEGATIVE_SIGN);
  const magnitude = isNegative ? printed.slice(1) : printed;
  const [coefficient = '', exponentValue = '0'] = magnitude.toLowerCase().split('e');
  const exponent = Number(exponentValue);
  const [whole = '', fraction = ''] = coefficient.split('.');
  const digits = `${whole}${fraction}`;
  const decimalPosition = whole.length + exponent;
  const sign = isNegative ? NEGATIVE_SIGN : '';

  if (decimalPosition <= 0) {
    return `${sign}0.${'0'.repeat(-decimalPosition)}${digits}`;
  }

  if (decimalPosition >= digits.length) {
    return `${sign}${digits}${'0'.repeat(decimalPosition - digits.length)}`;
  }

  return `${sign}${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`;
}

/**
 * Scales a decimal string to a whole number of its own digits, rounding half
 * away from zero at `places`.
 *
 * Multiplying by a power of ten is what the caller means, but not what it can
 * do: `0.000002 * 1e30` is not an integer in binary floating point, and every
 * figure this calculator later divides by would start out wrong.
 */
export function toScaledInteger(decimal: string, places: number): bigint {
  const isNegative = decimal.startsWith(NEGATIVE_SIGN);
  const magnitude = isNegative ? decimal.slice(1) : decimal;
  const [whole = '0', fraction = ''] = magnitude.split('.');
  const kept = fraction.slice(0, places).padEnd(places, '0');
  const shouldRoundUp = fraction.charAt(places) >= ROUND_UP_DIGIT;
  const scaled = BigInt(`${whole}${kept}`) + (shouldRoundUp ? CARRY : NO_CARRY);

  return isNegative ? -scaled : scaled;
}

/** Renders exact scaled units back as a decimal string, sign included. */
export function fromScaledInteger(scaled: bigint, places: number): string {
  const isNegative = scaled < NO_CARRY;
  const magnitude = isNegative ? -scaled : scaled;
  const scale = 10n ** BigInt(places);
  const fraction = (magnitude % scale)
    .toString()
    .padStart(places, '0')
    .replace(/0+$/u, '');
  const whole = (magnitude / scale).toString();
  const decimal = fraction.length > 0 ? `${whole}.${fraction}` : whole;

  return isNegative ? `${NEGATIVE_SIGN}${decimal}` : decimal;
}
