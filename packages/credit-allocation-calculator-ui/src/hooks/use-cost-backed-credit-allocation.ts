import type { CostBatch } from '@pixpilot/cost-calculator';
import type {
  CreateCreditAllocationOperationsOptions,
  CreditAllocationOperation,
} from '@pixpilot/credit-allocation-calculator';

import { createCreditAllocationOperations } from '@pixpilot/credit-allocation-calculator';
import { useCallback, useMemo, useState } from 'react';

/** The two values an administrator owns, keyed by the operation they belong to. */
type AllocationDecisions = Record<string, { creditsPerExecution: number; runs: number }>;

export interface UseCostBackedCreditAllocationResult {
  onChange: (value: CreditAllocationOperation[]) => void;
  value: CreditAllocationOperation[];
}

/**
 * Keeps a credit allocation priced by a cost scenario the host is still
 * editing.
 *
 * Only the allocation decisions are held here; the operations, their cost
 * paths, and the model pricing are re-derived from the cost input on every
 * render. Repointing the calculator at a different model, or editing a token
 * estimate, therefore reprices the allocation immediately, while the runs
 * and credits the administrator has set survive it — they are keyed by
 * operation, not by position.
 *
 * The first change keeps the administrator's explicit run and credit choices,
 * rather than overwriting them with a later cost-scenario quantity edit.
 */
export function useCostBackedCreditAllocation(
  costBatches: CostBatch[],
  options: CreateCreditAllocationOperationsOptions = {},
): UseCostBackedCreditAllocationResult {
  const { creditsPerExecution } = options;
  const [decisions, setDecisions] = useState<AllocationDecisions>({});

  const value = useMemo(() => {
    const derived = createCreditAllocationOperations(costBatches, {
      creditsPerExecution,
    });

    return derived.map((operation) => ({
      ...operation,
      ...decisions[operation.id],
    }));
  }, [costBatches, creditsPerExecution, decisions]);

  const onChange = useCallback((nextValue: CreditAllocationOperation[]) => {
    setDecisions(
      Object.fromEntries(
        nextValue.map((operation) => [
          operation.id,
          {
            creditsPerExecution: operation.creditsPerExecution,
            runs: operation.runs,
          },
        ]),
      ),
    );
  }, []);

  return { onChange, value };
}
