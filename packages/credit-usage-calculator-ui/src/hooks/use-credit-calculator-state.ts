import type { CreditUsage } from '@pixpilot/credit-usage-calculator';
import { useState } from 'react';

/**
 * The balance an unmanaged calculator opens on. Big enough that every action
 * has a range worth dragging, and round enough to read as a figure to edit
 * rather than as an allowance the visitor has been granted.
 */
export const DEFAULT_CREDIT_BALANCE = 500;

interface UseCreditCalculatorStateOptions {
  featureIds: readonly string[];
  credits?: number | undefined;
  initialCredits?: number | undefined;
  onCreditsChange?: ((credits: number) => void) | undefined;
  usage?: readonly CreditUsage[] | undefined;
  initialUsage?: readonly CreditUsage[] | undefined;
  onUsageChange?: ((usage: readonly CreditUsage[]) => void) | undefined;
  selectedFeatureId?: string | null | undefined;
  initialSelectedFeatureId?: string | null | undefined;
  onSelectedFeatureChange?: ((featureId: string | null) => void) | undefined;
}

interface CreditCalculatorState {
  activeCredits: number;
  activeFeatureId: string | null;
  /**
   * The feature the spending view would reopen on: the last one looked at, or
   * the first configured one until there is a last. Switching to the plan and
   * back therefore returns to the action the visitor was reading about rather
   * than resetting to the top of the list.
   */
  spendingFeatureId: string | null;
  currentUsage: readonly CreditUsage[];
  changeCredits: (credits: number) => void;
  changeQuantity: (featureId: string, quantity: number) => void;
  /** Replaces every quantity at once, as picking a worked example does. */
  changeUsage: (usage: readonly CreditUsage[]) => void;
  changeSelectedFeature: (featureId: string | null) => void;
}

function setFeatureQuantity(
  currentUsage: readonly CreditUsage[],
  featureId: string,
  quantity: number,
): CreditUsage[] {
  const nextUsage = currentUsage.filter((selection) => selection.featureId !== featureId);

  return quantity === 0 ? nextUsage : [...nextUsage, { featureId, quantity }];
}

/** Manages controlled and uncontrolled calculator quantities and selected views. */
export function useCreditCalculatorState({
  featureIds,
  credits,
  initialCredits = DEFAULT_CREDIT_BALANCE,
  onCreditsChange,
  usage,
  initialUsage = [],
  onUsageChange,
  selectedFeatureId,
  initialSelectedFeatureId = null,
  onSelectedFeatureChange,
}: UseCreditCalculatorStateOptions): CreditCalculatorState {
  const [uncontrolledCredits, setUncontrolledCredits] = useState(initialCredits);
  const [uncontrolledUsage, setUncontrolledUsage] =
    useState<readonly CreditUsage[]>(initialUsage);
  const [uncontrolledSelectedFeatureId, setUncontrolledSelectedFeatureId] = useState<
    string | null
  >(initialSelectedFeatureId);
  const [lastSpendingFeatureId, setLastSpendingFeatureId] = useState<string | null>(
    initialSelectedFeatureId,
  );
  const activeCredits = credits ?? uncontrolledCredits;
  const currentUsage = usage ?? uncontrolledUsage;
  const requestedFeatureId =
    selectedFeatureId === undefined ? uncontrolledSelectedFeatureId : selectedFeatureId;
  const activeFeatureId =
    requestedFeatureId !== null && featureIds.includes(requestedFeatureId)
      ? requestedFeatureId
      : null;
  // A remembered feature that has since been removed from the list is no
  // longer somewhere to return to, so it falls back like a first visit.
  const spendingFeatureId =
    lastSpendingFeatureId !== null && featureIds.includes(lastSpendingFeatureId)
      ? lastSpendingFeatureId
      : (featureIds[0] ?? null);

  const changeCredits = (nextCredits: number) => {
    if (credits === undefined) {
      setUncontrolledCredits(nextCredits);
    }

    onCreditsChange?.(nextCredits);
  };

  const changeUsage = (nextUsage: readonly CreditUsage[]) => {
    // Stored the way a slider stores it, so a preset and the same quantities
    // dragged by hand are one plan rather than two that merely look alike.
    const selectedUsage = nextUsage.filter((selection) => selection.quantity > 0);

    if (usage === undefined) {
      setUncontrolledUsage(selectedUsage);
    }

    onUsageChange?.(selectedUsage);
  };

  const changeQuantity = (featureId: string, quantity: number) => {
    changeUsage(setFeatureQuantity(currentUsage, featureId, quantity));
  };

  const changeSelectedFeature = (featureId: string | null) => {
    if (featureId !== null) {
      setLastSpendingFeatureId(featureId);
    }

    if (selectedFeatureId === undefined) {
      setUncontrolledSelectedFeatureId(featureId);
    }

    onSelectedFeatureChange?.(featureId);
  };

  return {
    activeCredits,
    activeFeatureId,
    spendingFeatureId,
    currentUsage,
    changeCredits,
    changeQuantity,
    changeUsage,
    changeSelectedFeature,
  };
}
