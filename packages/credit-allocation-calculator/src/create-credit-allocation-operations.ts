import type { CostBatch } from '@pixpilot/cost-calculator';

import type { CreditAllocationOperation } from './types.ts';

const MAX_ID_LENGTH = 256;
const FIRST_DUPLICATE_SUFFIX = 2;

/**
 * Every operation starts worth the same, so the first thing the administrator
 * reads is the cost-per-credit spread rather than an allocation somebody has
 * already guessed at.
 */
export const DEFAULT_CREDITS_PER_EXECUTION = 1;

/**
 * A starting credit allocation: one number for every operation, or the credits
 * an operation charges keyed by its batch name.
 */
export type CreditAllocationDefaults = number | Readonly<Record<string, number>>;

export interface CreateCreditAllocationOperationsOptions {
  /**
   * Starting credit allocation for every operation, or the credits each named
   * batch charges. A batch the record does not name keeps
   * `DEFAULT_CREDITS_PER_EXECUTION`.
   */
  creditsPerExecution?: CreditAllocationDefaults | undefined;
}

/**
 * Turns cost batches into a starting credit allocation.
 *
 * Each batch becomes one operation, keeping its cost paths untouched. The
 * caller supplies the single model when it later calculates the allocation.
 */
export function createCreditAllocationOperations(
  costBatches: CostBatch[],
  options: CreateCreditAllocationOperationsOptions = {},
): CreditAllocationOperation[] {
  const { creditsPerExecution } = options;
  const takenIds = new Set<string>();

  return costBatches.map<CreditAllocationOperation>((batch) => ({
    creditsPerExecution: creditsPerExecutionFor(batch.name, creditsPerExecution),
    id: toUniqueId(batch.name, takenIds),
    label: batch.name,
    paths: batch.paths,
    runs: batch.quantity,
  }));
}

/**
 * Resolves what one execution of a batch starts out charging.
 *
 * The lookup is by batch name rather than by position so that adding, removing,
 * or reordering an operation upstream still hands each one the credits it was
 * given.
 */
function creditsPerExecutionFor(
  batchName: string,
  creditsPerExecution: CreditAllocationDefaults | undefined,
): number {
  if (creditsPerExecution == null) return DEFAULT_CREDITS_PER_EXECUTION;
  if (typeof creditsPerExecution === 'number') return creditsPerExecution;

  return creditsPerExecution[batchName] ?? DEFAULT_CREDITS_PER_EXECUTION;
}

/**
 * Batch names need not be unique, but an operation id must be — it is what an
 * editor keys a slider's value by.
 */
function toUniqueId(name: string, takenIds: Set<string>): string {
  let candidate = name;

  for (let suffix = FIRST_DUPLICATE_SUFFIX; takenIds.has(candidate); suffix += 1) {
    const marker = ` (${suffix})`;
    candidate = `${name.slice(0, MAX_ID_LENGTH - marker.length)}${marker}`;
  }

  takenIds.add(candidate);

  return candidate;
}
