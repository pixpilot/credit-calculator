'use client';

import type {
  CreditAllocationOperation,
  CreditPricingScenario,
} from '@pixpilot/credit-allocation-calculator';
import type { ReactNode } from 'react';
import type { CreditAllocationModel } from '../types.ts';

import {
  calculateCreditAllocation,
  calculateCreditPricingEconomics,
} from '@pixpilot/credit-allocation-calculator';
import { useId, useMemo, useState } from 'react';
import { useCreditAllocationState } from '../hooks/use-credit-allocation-state.ts';
import { CreditAllocationSummary } from './CreditAllocationSummary.tsx';
import { CreditAllocationTable } from './CreditAllocationTable.tsx';

/** Wide enough for a generous allocation, and still draggable one credit at a time. */
const DEFAULT_MAX_CREDITS_PER_EXECUTION = 25;
/** Wide enough for most workloads, while retaining a practical slider range. */
const DEFAULT_MAX_RUNS = 1_000;
/** A stable empty list, so an unpriced calculator does not recalculate on every render. */
const NO_PRICING_SCENARIOS: CreditPricingScenario[] = [];

export interface CreditAllocationCalculatorProps {
  className?: string | undefined;
  /** The starting allocation when the host does not control the value. */
  defaultValue: CreditAllocationOperation[];
  /** Upper bound of the credits-per-execution slider. */
  maxCreditsPerExecution?: number | undefined;
  /** Upper bound of each operation's runs slider. */
  maxRuns?: number | undefined;
  /** The one model whose token rates price every operation. */
  model: CreditAllocationModel;
  onChange?: ((value: CreditAllocationOperation[]) => void) | undefined;
  /**
   * The plans and credit packs this allocation can be read against. With none,
   * the calculator shows provider cost alone, exactly as it did before pricing
   * existed.
   */
  pricingScenarios?: CreditPricingScenario[] | undefined;
  /**
   * Heading above the calculator. `null` when the host page already names it,
   * so the screen does not say it twice.
   */
  title?: string | null | undefined;
  value?: CreditAllocationOperation[] | undefined;
}

/**
 * Interactive editor for how many credits each operation should consume.
 *
 * The component owns no financial arithmetic: every figure on screen comes
 * from `calculateCreditAllocation`, which in turn takes provider execution
 * costs from `@pixpilot/cost-calculator`, and from
 * `calculateCreditPricingEconomics` downstream of it. Operations and pricing
 * scenarios are whatever the host supplies, so adding, removing, or renaming
 * one needs no change here.
 *
 * Moving a credits control therefore moves what the customer is charged and
 * what the operation earns, and never what it costs to serve.
 */
export function CreditAllocationCalculator(
  props: CreditAllocationCalculatorProps,
): ReactNode {
  const {
    className,
    defaultValue,
    maxCreditsPerExecution = DEFAULT_MAX_CREDITS_PER_EXECUTION,
    maxRuns = DEFAULT_MAX_RUNS,
    model,
    onChange,
    pricingScenarios = NO_PRICING_SCENARIOS,
    title = 'Credit allocation',
    value: controlledValue,
  } = props;

  const headingId = useId();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const { update, value } = useCreditAllocationState({
    defaultValue,
    onChange,
    value: controlledValue,
  });
  const result = useMemo(() => calculateCreditAllocation(value, model), [model, value]);
  const economics = useMemo(
    () =>
      pricingScenarios.length > 0
        ? calculateCreditPricingEconomics(result, pricingScenarios)
        : null,
    [pricingScenarios, result],
  );
  /** The host may drop or rename a scenario, so a stale choice falls back. */
  const selectedPricing =
    economics?.scenarios.find(
      (scenario) => scenario.scenario.id === selectedScenarioId,
    ) ?? economics?.scenarios[0];

  const updateOperation = (
    operationId: string,
    changes: Partial<CreditAllocationOperation>,
  ) => {
    update((currentValue) =>
      currentValue.map((operation) =>
        operation.id === operationId ? { ...operation, ...changes } : operation,
      ),
    );
  };

  return (
    <section
      aria-label={title == null ? 'Credit allocation' : undefined}
      aria-labelledby={title == null ? undefined : headingId}
      className={className ?? 'space-y-4'}
    >
      {title != null && (
        <h2 id={headingId} className="text-xl font-semibold">
          {title}
        </h2>
      )}

      <CreditAllocationSummary
        model={model}
        pricing={selectedPricing}
        pricingScenarios={economics?.scenarios}
        result={result}
        onPricingScenarioChange={setSelectedScenarioId}
      />

      <CreditAllocationTable
        maxCreditsPerExecution={maxCreditsPerExecution}
        maxRuns={maxRuns}
        pricing={selectedPricing}
        result={result}
        onCreditsChange={(operationId, creditsPerExecution) => {
          updateOperation(operationId, { creditsPerExecution });
        }}
        onRunsChange={(operationId, runs) => {
          updateOperation(operationId, { runs });
        }}
      />
    </section>
  );
}
