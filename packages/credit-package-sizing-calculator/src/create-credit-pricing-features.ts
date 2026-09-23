import type { CreditPricingFeature, CreditPricingFeatureInput } from './types.ts';

import { creditPricingFeaturesSchema } from './schemas.ts';

const FIRST_DUPLICATE_SUFFIX = 2;
const FALLBACK_ID = 'feature';
const NON_ID_CHARACTERS = /[^a-z0-9]+/gu;
const EDGE_SEPARATORS = /^-+|-+$/gu;

/**
 * Normalises a loose list of features into rows the calculator can price.
 *
 * Everything optional is filled in here rather than at every point of use, so
 * a caller may hand over the scenario list it already keeps for the cost
 * calculators — a name and whatever estimates it happens to have — without
 * restating the defaults.
 *
 * Identity is settled here too. Rows are keyed by a stable id rather than by
 * their position, because a table that can add and remove rows re-keys every
 * row below the one that changed, and a table that keys on the name loses the
 * row the moment the name is edited. An id a caller already supplied is kept,
 * so re-normalising a list the calculator itself produced is a no-op.
 */
export function createCreditPricingFeatures(
  features: readonly CreditPricingFeatureInput[],
): CreditPricingFeature[] {
  const takenIds = new Set<string>();

  return creditPricingFeaturesSchema.parse(features).map((feature) => ({
    ...feature,
    id: claimId(feature.id ?? toIdBase(feature.name), takenIds),
  }));
}

/**
 * Takes an id, or the next free variation of it.
 *
 * Two features may legitimately share a name — a duplicated row an
 * administrator is about to edit — and giving them the same id would make one
 * of them impossible to edit independently.
 */
function claimId(base: string, takenIds: Set<string>): string {
  let candidate = base;
  let suffix = FIRST_DUPLICATE_SUFFIX;

  while (takenIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  takenIds.add(candidate);

  return candidate;
}

function toIdBase(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(NON_ID_CHARACTERS, '-')
    .replace(EDGE_SEPARATORS, '');

  return slug.length > 0 ? slug : FALLBACK_ID;
}
