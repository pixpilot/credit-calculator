import type { CostBatch, ModelPricing } from '@pixpilot/cost-calculator';
import type { CreditAllocationOperation } from '@pixpilot/credit-allocation-calculator';
import type { ReactNode } from 'react';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CreditAllocationCalculator,
  useCostBackedCreditAllocation,
} from '../src/index.ts';
import { formatUnitUsd, formatUsd } from '../src/utils/format-money.ts';

/**
 * The screen's own arithmetic: what a row shows, what the totals show, and
 * that the two never disagree. Read back through the rendered text rather than
 * from the calculation result, because a correct calculation displayed at the
 * wrong precision is the same bug to whoever is reading the screen.
 */

const model: ModelPricing = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

/** $0.0021 per run. */
const insights: CreditAllocationOperation = {
  creditsPerExecution: 3,
  id: 'insights',
  label: 'Job Insights',
  paths: [
    { inputTokens: 10_000, name: 'AI analysis', outputTokens: 1_000, type: 'tokens' },
  ],
  runs: 50,
};

/** $0.0005 per run. */
const resumeExport: CreditAllocationOperation = {
  creditsPerExecution: 1,
  id: 'export',
  label: 'Resume Export',
  paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
  runs: 50,
};

/** $0.000002 per run — small enough to vanish at two decimal places. */
const edgePing: CreditAllocationOperation = {
  creditsPerExecution: 1,
  id: 'ping',
  label: 'Edge ping',
  paths: [{ costPerExecution: 0.000002, name: 'Edge call', type: 'fixed' }],
  runs: 4,
};

function creditsInput(label: string): HTMLInputElement {
  return screen.getByLabelText(`Credits per execution for ${label}`, {
    selector: 'input',
  });
}

function runsInput(label: string): HTMLInputElement {
  return screen.getByLabelText(`Runs for ${label}`, {
    selector: 'input',
  });
}

function summaryFigure(label: string): string {
  return screen.getByText(label).parentElement?.lastElementChild?.textContent ?? '';
}

/** The row's own cost, as the administrator reads it. */
function rowCost(label: string): string {
  const cells = screen.getByText(label).closest('tr')?.querySelectorAll('td');

  return cells?.[cells.length - 1]?.firstElementChild?.textContent ?? '';
}

function rowCostPerCredit(label: string): string {
  const cells = screen.getByText(label).closest('tr')?.querySelectorAll('td');

  return cells?.[cells.length - 1]?.lastElementChild?.textContent ?? '';
}

/** The grand total in the table footer, which must match the pinned summary. */
function footerTotalCost(): string {
  const row = screen.getByText('Total').closest('tr');
  const cells = row?.querySelectorAll('td');

  return cells?.[cells.length - 1]?.textContent ?? '';
}

/** Reads a displayed amount back as a number, so displayed rows can be summed. */
function toNumber(displayed: string): number {
  return Number(displayed.replace(/[$,]/gu, ''));
}

describe('a single feature on screen', () => {
  it('should show the same total in the row, the footer, and the summary', () => {
    render(<CreditAllocationCalculator defaultValue={[insights]} model={model} />);

    expect(rowCost('Job Insights')).toBe('$0.105');
    expect(footerTotalCost()).toBe('$0.105');
    expect(summaryFigure('Total cost')).toBe('$0.105');
  });

  it('should move the row and the totals together when its runs change', () => {
    render(<CreditAllocationCalculator defaultValue={[insights]} model={model} />);
    fireEvent.change(runsInput('Job Insights'), { target: { value: '100' } });

    expect(rowCost('Job Insights')).toBe('$0.21');
    expect(summaryFigure('Total cost')).toBe('$0.21');
    expect(summaryFigure('Total credits')).toBe('300');
  });

  it('should reprice its credits without touching what the feature costs to run', () => {
    render(<CreditAllocationCalculator defaultValue={[insights]} model={model} />);

    expect(rowCostPerCredit('Job Insights')).toBe('$0.00070 / credit');

    fireEvent.change(creditsInput('Job Insights'), { target: { value: '7' } });

    expect(rowCost('Job Insights')).toBe('$0.105');
    expect(summaryFigure('Total cost')).toBe('$0.105');
    expect(summaryFigure('Total credits')).toBe('350');
    expect(rowCostPerCredit('Job Insights')).toBe('$0.00030 / credit');
    expect(summaryFigure('Provider cost / credit')).toBe('$0.00030');
  });

  it('should keep charging nothing while it has no runs', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[{ ...insights, runs: 0 }]}
        model={model}
      />,
    );

    expect(rowCost('Job Insights')).toBe('$0.00');
    expect(summaryFigure('Total cost')).toBe('$0.00');
    expect(summaryFigure('Provider cost / credit')).toBe('—');
  });
});

describe('several features on screen', () => {
  const workload = [insights, resumeExport, edgePing];

  it('should show a grand total equal to the rows an administrator can see', () => {
    render(<CreditAllocationCalculator defaultValue={workload} model={model} />);

    const rows = workload.map((operation) => toNumber(rowCost(operation.label)));

    expect(rows).toEqual([0.105, 0.025, 0.000008]);
    expect(toNumber(summaryFigure('Total cost'))).toBeCloseTo(
      rows.reduce((total, cost) => total + cost, 0),
      12,
    );
    expect(footerTotalCost()).toBe(summaryFigure('Total cost'));
  });

  it('should keep the footer and summary in step as one feature is edited', () => {
    render(<CreditAllocationCalculator defaultValue={workload} model={model} />);
    fireEvent.change(runsInput('Resume Export'), { target: { value: '150' } });

    expect(rowCost('Resume Export')).toBe('$0.075');
    expect(rowCost('Job Insights')).toBe('$0.105');
    expect(footerTotalCost()).toBe(summaryFigure('Total cost'));
    expect(toNumber(summaryFigure('Total cost'))).toBeCloseTo(0.180008, 12);
  });

  it('should roll up runs and credits from every feature', () => {
    render(<CreditAllocationCalculator defaultValue={workload} model={model} />);

    const totalRow = screen.getByText('Total').closest('tr');

    expect(within(totalRow!).getByText('104')).toBeDefined();
    expect(summaryFigure('Total credits')).toBe('204');
  });

  it('should leave every other feature alone when one changes its credits', () => {
    render(<CreditAllocationCalculator defaultValue={workload} model={model} />);
    const before = summaryFigure('Total cost');

    fireEvent.change(creditsInput('Edge ping'), { target: { value: '9' } });

    expect(summaryFigure('Total cost')).toBe(before);
    expect(rowCost('Job Insights')).toBe('$0.105');
    expect(rowCost('Resume Export')).toBe('$0.025');
    expect(summaryFigure('Total credits')).toBe('236');
  });

  it('should never report a workload that costs something as costing nothing', () => {
    render(<CreditAllocationCalculator defaultValue={[edgePing]} model={model} />);

    expect(summaryFigure('Total cost')).toBe('$0.000008');
    expect(rowCost('Edge ping')).toBe('$0.000008');
  });
});

describe('values the calculator would reject', () => {
  it('should ignore a negative credit allocation rather than tear down the screen', () => {
    render(<CreditAllocationCalculator defaultValue={[insights]} model={model} />);

    expect(() =>
      fireEvent.change(creditsInput('Job Insights'), { target: { value: '-5' } }),
    ).not.toThrow();
    expect(summaryFigure('Total credits')).toBe('150');
  });

  it('should ignore a credit allocation above its own bound', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[insights]}
        maxCreditsPerExecution={25}
        model={model}
      />,
    );

    expect(() =>
      fireEvent.change(creditsInput('Job Insights'), { target: { value: '99999999' } }),
    ).not.toThrow();
    expect(summaryFigure('Total credits')).toBe('150');

    fireEvent.change(creditsInput('Job Insights'), { target: { value: '25' } });

    expect(summaryFigure('Total credits')).toBe('1,250');
  });

  it('should let a starting allocation above the bound stay editable', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[{ ...insights, creditsPerExecution: 40 }]}
        maxCreditsPerExecution={25}
        model={model}
      />,
    );
    fireEvent.change(creditsInput('Job Insights'), { target: { value: '30' } });

    expect(summaryFigure('Total credits')).toBe('1,500');
  });

  it('should ignore a fractional run count rather than tear down the screen', () => {
    render(<CreditAllocationCalculator defaultValue={[insights]} model={model} />);

    expect(() =>
      fireEvent.change(runsInput('Job Insights'), { target: { value: '1.5' } }),
    ).not.toThrow();
    expect(summaryFigure('Total cost')).toBe('$0.105');
  });

  it('should ignore a half-typed credit allocation while it is still empty', () => {
    render(<CreditAllocationCalculator defaultValue={[insights]} model={model} />);

    expect(() =>
      fireEvent.change(creditsInput('Job Insights'), { target: { value: '' } }),
    ).not.toThrow();
    expect(summaryFigure('Total credits')).toBe('150');
  });
});

describe('an allocation priced by a cost scenario the host still owns', () => {
  const costBatches: CostBatch[] = [
    {
      name: 'Job Insights',
      paths: [
        { inputTokens: 10_000, name: 'AI analysis', outputTokens: 1_000, type: 'tokens' },
      ],
      quantity: 50,
    },
    {
      name: 'Resume Export',
      paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
      quantity: 50,
    },
  ];

  function CostBackedCalculator(): ReactNode {
    const allocation = useCostBackedCreditAllocation(costBatches);

    return (
      <CreditAllocationCalculator
        defaultValue={allocation.value}
        model={model}
        value={allocation.value}
        onChange={allocation.onChange}
      />
    );
  }

  it('should retotal the whole allocation when one run count is edited', () => {
    render(<CostBackedCalculator />);

    expect(summaryFigure('Total cost')).toBe('$0.13');

    fireEvent.change(runsInput('Job Insights'), { target: { value: '150' } });

    expect(rowCost('Job Insights')).toBe('$0.315');
    expect(summaryFigure('Total cost')).toBe('$0.34');
    expect(footerTotalCost()).toBe('$0.34');
    expect(summaryFigure('Total credits')).toBe('200');
  });

  it('should hold the cost steady while credits are reallocated across features', () => {
    render(<CostBackedCalculator />);
    fireEvent.change(creditsInput('Job Insights'), { target: { value: '4' } });
    fireEvent.change(creditsInput('Resume Export'), { target: { value: '2' } });

    expect(summaryFigure('Total cost')).toBe('$0.13');
    expect(summaryFigure('Total credits')).toBe('300');
    expect(rowCost('Job Insights')).toBe('$0.105');
    expect(rowCost('Resume Export')).toBe('$0.025');
  });
});

describe('money formatting', () => {
  it('should round a long amount half up instead of truncating it', () => {
    expect(formatUsd({ amount: '0.5077512355', currency: 'USD' })).toBe('$0.50775124');
  });

  it('should keep a sub-cent total visible instead of rounding it to cents', () => {
    expect(formatUsd({ amount: '0.130008', currency: 'USD' })).toBe('$0.130008');
    expect(formatUsd({ amount: '12.5', currency: 'USD' })).toBe('$12.50');
  });

  it('should show a total that would round away rather than report it as free', () => {
    expect(formatUsd({ amount: '0.000008', currency: 'USD' })).toBe('$0.000008');
    expect(formatUsd({ amount: '0.0000000001', currency: 'USD' })).toBe('$0.0000000001');
  });

  it('should still report an amount of nothing as nothing', () => {
    expect(formatUsd({ amount: '0', currency: 'USD' })).toBe('$0.00');
    expect(formatUnitUsd({ amount: '0', currency: 'USD' })).toBe('$0.00000');
  });

  it('should group the whole part of a large total', () => {
    expect(formatUsd({ amount: '1234567.891', currency: 'USD' })).toBe('$1,234,567.891');
  });

  it('should keep a rate that would round away readable', () => {
    expect(formatUnitUsd({ amount: '0.0000000001', currency: 'USD' })).toBe(
      '$0.0000000001',
    );
  });

  it('should show an absent rate as a dash rather than as zero', () => {
    expect(formatUnitUsd(null)).toBe('—');
  });
});
