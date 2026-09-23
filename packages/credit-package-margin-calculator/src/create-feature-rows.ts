import type { FeatureRow } from './types.ts';

const NONE = 0;
const ONE_EXECUTION = 1;
const FIRST_USE = 0;
const NEXT_USE = 1;

/**
 * A feature as a caller already describes it elsewhere.
 *
 * Written out structurally rather than imported, so this calculator never
 * depends on the evaluator packages: anything that names an operation and
 * estimates what one run of it burns can seed the table, and
 * `ModelCostScenario` happens to be one such thing.
 */
export interface CreditPackageFeatureScenario {
  /** Credits one run charges. A scenario that charges none is still costed. */
  creditsPerExecution?: number | undefined;
  /** A non-model cost of one run, such as rendering a PDF. */
  fixedCostPerExecution?: number | undefined;
  inputTokens?: number | undefined;
  name: string;
  outputTokens?: number | undefined;
  quantity?: number | undefined;
}

/**
 * Turns the scenarios an application already maintains into editable rows.
 *
 * Nothing is priced here: the estimates are carried across as they are, and
 * only the fields a scenario may leave out are filled in — a run costs no
 * tokens it does not name, and happens once unless it says otherwise.
 *
 * Ids are derived from the names so that a row keeps its identity across a
 * re-seed, with a suffix where two features happen to share a name.
 */
export function createFeatureRows(
  scenarios: readonly CreditPackageFeatureScenario[],
): FeatureRow[] {
  const usedIds = new Map<string, number>();

  return scenarios.map<FeatureRow>((scenario) => ({
    creditCost: scenario.creditsPerExecution ?? NONE,
    fixedCost: scenario.fixedCostPerExecution ?? NONE,
    id: takeUniqueId(usedIds, toSlug(scenario.name)),
    inputTokens: scenario.inputTokens ?? NONE,
    name: scenario.name,
    outputTokens: scenario.outputTokens ?? NONE,
    quantity: scenario.quantity ?? ONE_EXECUTION,
  }));
}

function toSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  return slug === '' ? 'feature' : slug;
}

function takeUniqueId(usedIds: Map<string, number>, slug: string): string {
  const timesUsed = usedIds.get(slug) ?? FIRST_USE;

  usedIds.set(slug, timesUsed + NEXT_USE);

  return timesUsed === FIRST_USE ? slug : `${slug}-${timesUsed + NEXT_USE}`;
}
