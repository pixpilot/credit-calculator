import type { Money } from '@pixpilot/cost-calculator';

/**
 * Display formatting for a calculator whose interesting digits sit below a
 * cent.
 *
 * Amounts are formatted from their own decimal digits rather than from a
 * float, so a cost per credit of `$0.0008404` survives the trip to the screen.
 * Rounding happens here and nowhere else: every figure stays exact for further
 * arithmetic and is shortened only at the point it is read.
 *
 * The currency is carried through every helper rather than hard-coded into the
 * `$`, so the day a second currency is priced the change is one argument and
 * not a search for dollar signs.
 */

const TOTAL_MINIMUM_DIGITS = 2;
const TOTAL_MAXIMUM_DIGITS = 8;
const UNIT_DIGITS = 6;
const FALLBACK_DIGITS = 12;
const PERCENT_MINIMUM_DIGITS = 1;
const PERCENT_MAXIMUM_DIGITS = 2;
const NO_DIGITS = 0;
const ROUND_UP_DIGIT = '5';
const CARRY = 1n;
const NO_CARRY = 0n;
const NEGATIVE_SIGN = '-';

/** What every helper shows in place of a figure that has no value. */
export const ABSENT = '—';

/** How amounts, counts, and percentages are rendered for one audience. */
export interface CreditPricingFormat {
  currency: string;
  locale: string;
}

/** United States dollars, the currency the calculator's amounts are held in. */
export const DEFAULT_FORMAT: CreditPricingFormat = { currency: 'USD', locale: 'en-US' };

/**
 * Formats an exact amount, keeping enough decimal places to show the cheapest
 * feature this calculator is built for.
 *
 * An amount too small even for that is shown with more digits rather than as
 * `$0.00`: a workload that costs almost nothing is still not free, and reading
 * it as free is the mistake this screen exists to prevent.
 */
export function formatMoney(
  money: Money | null | undefined,
  format: CreditPricingFormat,
  minimumFractionDigits = TOTAL_MINIMUM_DIGITS,
  maximumFractionDigits = TOTAL_MAXIMUM_DIGITS,
): string {
  if (money == null) return ABSENT;

  const formatted = toFixedMoney(
    money,
    format,
    minimumFractionDigits,
    maximumFractionDigits,
  );

  return isRoundedAway(formatted) && !isZero(money)
    ? toFixedMoney(money, format, minimumFractionDigits, FALLBACK_DIGITS)
    : formatted;
}

/**
 * Formats a per-unit rate — cost per execution, cost per credit — which is
 * where this calculator's interesting digits live, so it starts at more
 * decimal places than a total does.
 */
export function formatUnitMoney(
  money: Money | null | undefined,
  format: CreditPricingFormat,
): string {
  return formatMoney(money, format, UNIT_DIGITS, UNIT_DIGITS);
}

/** Formats a percentage to the one or two places a margin is read at. */
export function formatPercent(
  percent: number | null | undefined,
  format: CreditPricingFormat,
): string {
  if (percent == null || !Number.isFinite(percent)) return ABSENT;

  return `${new Intl.NumberFormat(format.locale, {
    maximumFractionDigits: PERCENT_MAXIMUM_DIGITS,
    minimumFractionDigits: PERCENT_MINIMUM_DIGITS,
  }).format(percent)}%`;
}

/** Formats a plain count — credits, tokens, runs — with digit grouping. */
export function formatCount(
  value: number | null | undefined,
  format: CreditPricingFormat,
  maximumFractionDigits = NO_DIGITS,
): string {
  if (value == null || !Number.isFinite(value)) return ABSENT;

  return new Intl.NumberFormat(format.locale, { maximumFractionDigits }).format(value);
}

/**
 * Formats a calculated credit limit, always rounding down.
 *
 * A limit of 694.9 credits is not a licence to sell 695: the fraction is the
 * part the target margin does not cover.
 */
export function formatCreditLimit(
  credits: number | null | undefined,
  format: CreditPricingFormat,
): string {
  if (credits == null || !Number.isFinite(credits)) return ABSENT;

  return formatCount(Math.floor(credits), format);
}

function toFixedMoney(
  money: Money,
  format: CreditPricingFormat,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): string {
  const rounded = roundDecimal(money.amount, maximumFractionDigits);
  const isNegative = rounded.startsWith(NEGATIVE_SIGN);
  const [whole = '0', fraction = ''] = (isNegative ? rounded.slice(1) : rounded).split(
    '.',
  );
  const displayFraction = fraction.replace(/0+$/u, '').padEnd(minimumFractionDigits, '0');
  const groupedWhole = new Intl.NumberFormat(format.locale).format(BigInt(whole));
  const symbol = currencySymbol(format);
  const amount =
    displayFraction.length > 0
      ? `${symbol}${groupedWhole}.${displayFraction}`
      : `${symbol}${groupedWhole}`;

  return isNegative ? `${NEGATIVE_SIGN}${amount}` : amount;
}

/**
 * The currency's own symbol, taken from the locale's formatter rather than
 * from a table this package would have to keep up to date.
 */
function currencySymbol(format: CreditPricingFormat): string {
  const parts = new Intl.NumberFormat(format.locale, {
    currency: format.currency,
    style: 'currency',
  }).formatToParts(1);

  return parts.find((part) => part.type === 'currency')?.value ?? format.currency;
}

/** True when a formatted amount reads as nothing at all: `$0`, `$0.00`, … */
function isRoundedAway(formatted: string): boolean {
  return /^\D*0(?:\.0*)?$/u.test(formatted);
}

function isZero(money: Money): boolean {
  return /^-?0(?:\.0*)?$/u.test(money.amount);
}

/** Rounds a decimal string half up, without ever building a float from it. */
function roundDecimal(amount: string, digits: number): string {
  const isNegative = amount.startsWith(NEGATIVE_SIGN);
  const magnitude = isNegative ? amount.slice(1) : amount;
  const [whole = '0', fraction = ''] = magnitude.split('.');
  const keptFraction = fraction.slice(0, digits).padEnd(digits, '0');
  const shouldRoundUp = fraction.charAt(digits) >= ROUND_UP_DIGIT;
  const scaled = (BigInt(`${whole}${keptFraction}`) + (shouldRoundUp ? CARRY : NO_CARRY))
    .toString()
    .padStart(digits + 1, '0');
  const rounded =
    digits === NO_DIGITS
      ? scaled
      : `${scaled.slice(0, scaled.length - digits)}.${scaled.slice(scaled.length - digits)}`;

  return isNegative ? `${NEGATIVE_SIGN}${rounded}` : rounded;
}
