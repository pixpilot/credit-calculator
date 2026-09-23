import type { Money } from '@pixpilot/cost-calculator';

import type {
  CalculatedCreditAllocationOperation,
  CalculatedCreditPricingOperation,
  CalculatedCreditPricingScenario,
  CreditAllocationResult,
  CreditPricingEconomicsResult,
  CreditPricingScenario,
} from './types.ts';
import { divideMoney, multiplyMoney, sumMoney } from '@pixpilot/cost-calculator';

import { divideMoneyIntoRatio, subtractMoney } from './money-math.ts';
import { creditPricingScenariosSchema } from './schemas.ts';

const NO_CREDITS = 0;

/**
 * Reads a finished allocation as revenue, under one or more pricing scenarios.
 *
 * Nothing here reprices an execution: every provider figure is the one
 * `calculateCreditAllocation` already produced, and this layer only asks what
 * the credits an operation consumes are worth to the business. That is what
 * lets the same allocation be read against a subscription plan, a credit pack,
 * and a discounted bundle at once — the provider cost is identical in all
 * three, and only the margin moves.
 *
 * Each scenario derives its revenue per credit from its own price and the
 * credits that price buys, bonus credits included, so a promotion shows up as
 * the thinner margin it is rather than as revenue the customer never paid.
 */
export function calculateCreditPricingEconomics(
  allocation: CreditAllocationResult,
  scenarios: CreditPricingScenario[],
): CreditPricingEconomicsResult {
  const validatedScenarios = creditPricingScenariosSchema.parse(scenarios);

  return {
    scenarios: validatedScenarios.map((scenario) =>
      toCalculatedScenario(allocation, scenario),
    ),
  };
}

function toCalculatedScenario(
  allocation: CreditAllocationResult,
  scenario: CreditPricingScenario,
): CalculatedCreditPricingScenario {
  const spendableCredits =
    scenario.includedCredits + (scenario.bonusCredits ?? NO_CREDITS);
  const effectiveRevenuePerCredit =
    spendableCredits > NO_CREDITS
      ? divideMoney(scenario.packagePrice, spendableCredits)
      : null;
  const operations = allocation.operations.map((operation) =>
    toCalculatedOperation(operation, effectiveRevenuePerCredit),
  );
  const totalRevenue = sumRevenue(operations);
  const totalGrossProfit =
    totalRevenue == null ? null : subtractMoney(totalRevenue, allocation.totalCost);

  return {
    effectiveRevenuePerCredit,
    grossMargin:
      totalRevenue == null || totalGrossProfit == null
        ? null
        : divideMoneyIntoRatio(totalGrossProfit, totalRevenue),
    operations,
    scenario,
    spendableCredits,
    totalGrossProfit,
    totalProviderCost: allocation.totalCost,
    totalRevenue,
  };
}

function toCalculatedOperation(
  operation: CalculatedCreditAllocationOperation,
  effectiveRevenuePerCredit: Money | null,
): CalculatedCreditPricingOperation {
  const revenuePerExecution =
    effectiveRevenuePerCredit == null
      ? null
      : multiplyMoney(effectiveRevenuePerCredit, operation.creditsPerExecution);
  const grossProfitPerExecution =
    revenuePerExecution == null
      ? null
      : subtractMoney(revenuePerExecution, operation.costPerExecution);
  const totalRevenue =
    revenuePerExecution == null
      ? null
      : multiplyMoney(revenuePerExecution, operation.runs);

  return {
    creditsPerExecution: operation.creditsPerExecution,
    effectiveRevenuePerCredit,
    grossMargin:
      revenuePerExecution == null || grossProfitPerExecution == null
        ? null
        : divideMoneyIntoRatio(grossProfitPerExecution, revenuePerExecution),
    grossProfitPerExecution,
    id: operation.id,
    label: operation.label,
    providerCostPerCredit: operation.providerCostPerCredit,
    providerCostPerExecution: operation.costPerExecution,
    revenuePerExecution,
    runs: operation.runs,
    totalGrossProfit:
      totalRevenue == null ? null : subtractMoney(totalRevenue, operation.cost),
    totalProviderCost: operation.cost,
    totalRevenue,
  };
}

/**
 * Adds up what every operation earns, so the scenario total is the rows an
 * administrator can see rather than a separately derived figure.
 *
 * A scenario that sells no spendable credits earns nothing calculable at all,
 * and says so, rather than reporting a revenue of zero it did not make.
 */
function sumRevenue(operations: CalculatedCreditPricingOperation[]): Money | null {
  const revenues: Money[] = [];

  for (const operation of operations) {
    if (operation.totalRevenue == null) return null;
    revenues.push(operation.totalRevenue);
  }

  return sumMoney(revenues);
}
