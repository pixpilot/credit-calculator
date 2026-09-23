import type { FeatureRow, PackageRow } from '@pixpilot/credit-package-margin-calculator';

const NOTHING = 0;
const ONE_RUN = 1;
const BLANK_PACKAGE_PRICE = 5;
const BLANK_PACKAGE_CREDITS = 500;

/**
 * A feature that costs nothing until it is described.
 *
 * It charges no credits to begin with, so an unfilled row never becomes the
 * worst case and never drags a margin down before anyone has typed into it.
 */
export function createBlankFeatureRow(id: string): FeatureRow {
  return {
    creditCost: NOTHING,
    fixedCost: NOTHING,
    id,
    inputTokens: NOTHING,
    name: 'New feature',
    outputTokens: NOTHING,
    quantity: ONE_RUN,
  };
}

/** A new pack, seeded at the price point the product already sells. */
export function createBlankPackageRow(id: string): PackageRow {
  return { credits: BLANK_PACKAGE_CREDITS, id, price: BLANK_PACKAGE_PRICE };
}
