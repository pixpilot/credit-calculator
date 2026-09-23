import type { ModelPricing } from '@pixpilot/cost-calculator';
import type {
  CreditAllocationOperation,
  CreditPricingScenario,
} from '@pixpilot/credit-allocation-calculator';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CreditAllocationCalculator } from '../src/index.ts';

/**
 * What the pricing layer puts on screen: the scenario an administrator picked,
 * what the credits it sells are worth, and the margin each operation earns
 * under it. Read back through the rendered text, because a correct calculation
 * shown against the wrong scenario is the same mistake to whoever reads it.
 */

const model: ModelPricing = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

/** $0.002852 per run: 15k in, 1k out, plus a worker call. */
const insights: CreditAllocationOperation = {
  creditsPerExecution: 5,
  id: 'insights',
  label: 'Job Insights',
  paths: [
    { inputTokens: 15_000, name: 'AI analysis', outputTokens: 1_000, type: 'tokens' },
    { costPerExecution: 0.000002, name: 'Worker execution', type: 'fixed' },
  ],
  runs: 35,
};

/** $20 for 10,000 credits: $0.002 of revenue per credit. */
const starterPlan: CreditPricingScenario = {
  id: 'starter',
  includedCredits: 10_000,
  label: 'Starter plan',
  packagePrice: { amount: '20', currency: 'USD' },
};

/** The same $20, spread across 2,000 promotional credits as well. */
const promotionalPlan: CreditPricingScenario = {
  bonusCredits: 2_000,
  id: 'promotional',
  includedCredits: 10_000,
  label: 'Launch promotion',
  packagePrice: { amount: '20', currency: 'USD' },
};

function summaryFigure(label: string): string {
  return screen.getByText(label).parentElement?.lastElementChild?.textContent ?? '';
}

function operationRow(label: string): HTMLElement {
  return screen.getByText(label).closest('tr') as HTMLElement;
}

function scenarioSelect(): HTMLElement {
  return screen.getByLabelText('Pricing scenario');
}

function selectScenario(name: string): void {
  fireEvent.click(scenarioSelect());
  fireEvent.click(screen.getByRole('option', { name }));
}

describe('an allocation read against a pricing scenario', () => {
  it('should show what the selected scenario sells a credit for', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[insights]}
        model={model}
        pricingScenarios={[starterPlan]}
      />,
    );

    expect(summaryFigure('Package price')).toBe('$20.00');
    expect(summaryFigure('Spendable credits')).toBe('10,000');
    expect(summaryFigure('Revenue / credit')).toBe('$0.00200');
  });

  it('should show what each operation earns and the margin it makes', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[insights]}
        model={model}
        pricingScenarios={[starterPlan]}
      />,
    );
    const row = operationRow('Job Insights');

    // 5 credits at $0.002 is $0.01 a run, against $0.002852 of provider cost.
    expect(within(row).getByText('$0.01000 / run')).toBeDefined();
    expect(within(row).getByText('$0.00057 / credit')).toBeDefined();
    expect(within(row).getByText('$0.35')).toBeDefined();
    expect(within(row).getByText('71.5%')).toBeDefined();
  });

  it('should total revenue, gross profit, and margin above the table', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[insights]}
        model={model}
        pricingScenarios={[starterPlan]}
      />,
    );

    expect(summaryFigure('Total cost')).toBe('$0.09982');
    expect(summaryFigure('Provider cost / credit')).toBe('$0.00057');
    expect(summaryFigure('Total revenue')).toBe('$0.35');
    expect(summaryFigure('Total gross profit')).toBe('$0.25018');
    expect(summaryFigure('Gross margin')).toBe('71.5%');
  });

  it('should charge the customer more for the same execution as credits rise', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[{ ...insights, creditsPerExecution: 10 }]}
        model={model}
        pricingScenarios={[starterPlan]}
      />,
    );

    // Twice the credits: twice the revenue, and the same provider cost.
    expect(summaryFigure('Total cost')).toBe('$0.09982');
    expect(summaryFigure('Total revenue')).toBe('$0.70');
    expect(summaryFigure('Gross margin')).toBe('85.7%');
    expect(
      within(operationRow('Job Insights')).getByText('$0.00029 / credit'),
    ).toBeDefined();
  });

  it('should report a loss when the credits earn less than the run costs', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[{ ...insights, creditsPerExecution: 1 }]}
        model={model}
        pricingScenarios={[starterPlan]}
      />,
    );

    expect(summaryFigure('Total revenue')).toBe('$0.07');
    expect(summaryFigure('Total gross profit')).toBe('-$0.02982');
    expect(summaryFigure('Gross margin')).toBe('-42.6%');
  });

  it('should show no revenue columns at all when the host prices nothing', () => {
    render(<CreditAllocationCalculator defaultValue={[insights]} model={model} />);

    expect(screen.queryByLabelText('Pricing scenario')).toBeNull();
    expect(screen.queryByText('Revenue')).toBeNull();
    expect(screen.queryByText('Margin')).toBeNull();
    expect(screen.queryByText('Total revenue')).toBeNull();
    expect(summaryFigure('Provider cost / credit')).toBe('$0.00057');
  });
});

describe('more than one pricing scenario', () => {
  it('should open on the first scenario the host offered', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[insights]}
        model={model}
        pricingScenarios={[starterPlan, promotionalPlan]}
      />,
    );

    expect(scenarioSelect().textContent).toContain('Starter plan');
    expect(summaryFigure('Spendable credits')).toBe('10,000');
  });

  it('should reprice the same allocation when another scenario is chosen', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[insights]}
        model={model}
        pricingScenarios={[starterPlan, promotionalPlan]}
      />,
    );
    selectScenario('Launch promotion');

    // The same $20 now buys 12,000 credits, so each one is worth less.
    expect(summaryFigure('Spendable credits')).toBe('12,000');
    expect(summaryFigure('Revenue / credit')).toBe('$0.00167');
    expect(summaryFigure('Total revenue')).toBe('$0.29166667');
    expect(summaryFigure('Gross margin')).toBe('65.8%');
  });

  it('should leave the provider cost untouched by the scenario chosen', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[insights]}
        model={model}
        pricingScenarios={[starterPlan, promotionalPlan]}
      />,
    );
    const before = summaryFigure('Total cost');

    selectScenario('Launch promotion');

    expect(summaryFigure('Total cost')).toBe(before);
    expect(summaryFigure('Provider cost / credit')).toBe('$0.00057');
  });
});

describe('scenarios that sell nothing', () => {
  it('should read a free plan as revenue of nothing rather than as no plan', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[insights]}
        model={model}
        pricingScenarios={[
          {
            id: 'free',
            includedCredits: 10_000,
            label: 'Free plan',
            packagePrice: { amount: '0', currency: 'USD' },
          },
        ]}
      />,
    );

    expect(summaryFigure('Revenue / credit')).toBe('$0.00000');
    expect(summaryFigure('Total revenue')).toBe('$0.00');
    expect(summaryFigure('Total gross profit')).toBe('-$0.09982');
    expect(summaryFigure('Gross margin')).toBe('—');
  });

  it('should refuse to price a scenario granting no spendable credits', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[insights]}
        model={model}
        pricingScenarios={[
          {
            id: 'empty',
            includedCredits: 0,
            label: 'Nothing included',
            packagePrice: { amount: '20', currency: 'USD' },
          },
        ]}
      />,
    );

    expect(summaryFigure('Revenue / credit')).toBe('—');
    expect(summaryFigure('Total revenue')).toBe('—');
    expect(summaryFigure('Total gross profit')).toBe('—');
    expect(summaryFigure('Gross margin')).toBe('—');
    expect(summaryFigure('Total cost')).toBe('$0.09982');
  });

  it('should earn nothing from an operation that charges no credits', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[{ ...insights, creditsPerExecution: 0 }]}
        model={model}
        pricingScenarios={[starterPlan]}
      />,
    );
    const row = operationRow('Job Insights');

    expect(within(row).getByText('— / credit')).toBeDefined();
    expect(within(row).getByText('$0.00000 / run')).toBeDefined();
    expect(within(row).getByText('—')).toBeDefined();
    expect(summaryFigure('Total gross profit')).toBe('-$0.09982');
  });
});
