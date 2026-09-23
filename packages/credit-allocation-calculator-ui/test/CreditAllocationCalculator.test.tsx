import type { CostBatch, ModelPricing } from '@pixpilot/cost-calculator';
import type { CreditAllocationOperation } from '@pixpilot/credit-allocation-calculator';

import { createCreditAllocationOperations } from '@pixpilot/credit-allocation-calculator';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreditAllocationCalculator } from '../src/index.ts';
import { formatUnitUsd, formatUsd } from '../src/utils/format-money.ts';

const model: ModelPricing = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

const defaultValue: CreditAllocationOperation[] = [
  {
    creditsPerExecution: 3,
    id: 'insights',
    label: 'Job Insights',
    paths: [
      {
        inputTokens: 10_000,
        name: 'AI analysis',
        outputTokens: 1_000,
        type: 'tokens',
      },
    ],
    runs: 50,
  },
  {
    creditsPerExecution: 1,
    id: 'export',
    label: 'Resume Export',
    paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
    runs: 50,
  },
];

function runsInput(label: string): HTMLElement {
  return screen.getByLabelText(`Runs for ${label}`, { selector: 'input' });
}

function creditsInput(label: string): HTMLElement {
  return screen.getByLabelText(`Credits per execution for ${label}`, {
    selector: 'input',
  });
}

function summaryFigure(label: string): string {
  const figure = screen.getByText(label).parentElement;

  return figure?.lastElementChild?.textContent ?? '';
}

describe('credit allocation calculator', () => {
  it('should render every dynamically supplied operation with both controls', () => {
    render(<CreditAllocationCalculator defaultValue={defaultValue} model={model} />);

    expect(screen.getByText('Job Insights')).toBeDefined();
    expect(screen.getByText('Resume Export')).toBeDefined();
    expect(runsInput('Job Insights')).toBeDefined();
    expect(creditsInput('Resume Export')).toBeDefined();
  });

  it('should render an arbitrary operation list without knowing its features', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={[
          {
            creditsPerExecution: 2,
            id: 'anything',
            label: 'Some Other Product Action',
            paths: [{ costPerExecution: 0.01, name: 'Whatever', type: 'fixed' }],
            runs: 100,
          },
        ]}
        model={model}
      />,
    );

    expect(screen.getByText('Some Other Product Action')).toBeDefined();
    expect(summaryFigure('Total credits')).toBe('200');
  });

  it('should show the totals the calculator produced', () => {
    render(<CreditAllocationCalculator defaultValue={defaultValue} model={model} />);

    expect(summaryFigure('Total credits')).toBe('200');
    expect(summaryFigure('Total cost')).toBe('$0.13');
    expect(summaryFigure('Provider cost / credit')).toBe('$0.00065');
  });

  it('should show the model pricing and supplied token limits', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={defaultValue}
        model={{
          contextLength: 128_000,
          inputPricePerMillionTokens: 0.15,
          maxOutputTokens: 16_384,
          name: 'GPT-5 mini',
          outputPricePerMillionTokens: 0.6,
        }}
      />,
    );

    expect(summaryFigure('Model')).toBe('GPT-5 mini');
    expect(summaryFigure('Input')).toBe('$0.15 / 1M');
    expect(summaryFigure('Output')).toBe('$0.60 / 1M');
    expect(summaryFigure('Context')).toBe('128K tokens');
    expect(summaryFigure('Max output')).toBe('16.4K tokens');
  });

  it('should show each operation cost per run and per credit on its own row', () => {
    render(<CreditAllocationCalculator defaultValue={defaultValue} model={model} />);

    const row = screen.getByText('Job Insights').closest('tr');

    expect(within(row!).getByText('$0.00210 / run')).toBeDefined();
    expect(within(row!).getByText('$0.00070 / credit')).toBeDefined();
    expect(within(row!).getByText('$0.105')).toBeDefined();
  });

  it('should recalculate the summary when a credits slider changes', () => {
    render(<CreditAllocationCalculator defaultValue={defaultValue} model={model} />);
    fireEvent.change(creditsInput('Job Insights'), { target: { value: '6' } });

    expect(summaryFigure('Total credits')).toBe('350');
    expect(summaryFigure('Total cost')).toBe('$0.13');
    expect(summaryFigure('Provider cost / credit')).toBe('$0.00037');
  });

  it('should reprice the same allocation when its one model changes', () => {
    const { rerender } = render(
      <CreditAllocationCalculator defaultValue={defaultValue} model={model} />,
    );

    rerender(
      <CreditAllocationCalculator
        defaultValue={defaultValue}
        model={{ inputPricePerMillionTokens: 0.3, outputPricePerMillionTokens: 1.2 }}
      />,
    );

    expect(summaryFigure('Total cost')).toBe('$0.235');
  });

  it('should report a changed run count through onChange without owning the value', () => {
    const onChange = vi.fn();

    render(
      <CreditAllocationCalculator
        defaultValue={defaultValue}
        model={model}
        value={defaultValue}
        onChange={onChange}
      />,
    );
    fireEvent.change(runsInput('Resume Export'), { target: { value: '10' } });

    expect(onChange).toHaveBeenLastCalledWith([
      defaultValue[0],
      { ...defaultValue[1], runs: 10 },
    ]);
    expect(summaryFigure('Total credits')).toBe('200');
  });

  it('should title itself only when the host has not already named it', () => {
    const { rerender } = render(
      <CreditAllocationCalculator defaultValue={defaultValue} model={model} />,
    );

    expect(screen.getByRole('heading', { name: 'Credit allocation' })).toBeDefined();

    rerender(
      <CreditAllocationCalculator
        defaultValue={defaultValue}
        model={model}
        title={null}
      />,
    );

    expect(screen.queryByRole('heading', { name: 'Credit allocation' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Credit allocation' })).toBeDefined();
  });
});

describe('an allocation derived from a cost scenario', () => {
  const costBatches: CostBatch[] = [
    {
      name: 'Job Insights',
      paths: [
        {
          inputTokens: 10_000,
          name: 'AI operation',
          outputTokens: 1_000,
          type: 'tokens',
        },
      ],
      quantity: 75,
    },
    {
      name: 'Resume Export',
      paths: [{ costPerExecution: 0.0005, name: 'PDF rendering', type: 'fixed' }],
      quantity: 25,
    },
  ];

  it('should seed the runs sliders from the cost scenario quantities', () => {
    render(
      <CreditAllocationCalculator
        defaultValue={createCreditAllocationOperations(costBatches)}
        model={model}
      />,
    );

    expect(runsInput('Job Insights')).toHaveValue(75);
    expect(runsInput('Resume Export')).toHaveValue(25);
    expect(creditsInput('Job Insights')).toHaveValue(1);
  });
});

describe('money formatting', () => {
  it('should keep a rate that would round away readable', () => {
    expect(formatUnitUsd({ amount: '0.0000000001', currency: 'USD' })).toBe(
      '$0.0000000001',
    );
  });

  it('should show an absent rate as a dash rather than as zero', () => {
    expect(formatUnitUsd(null)).toBe('—');
  });

  it('should round a long amount half up instead of truncating it', () => {
    expect(formatUsd({ amount: '0.5077512355', currency: 'USD' })).toBe('$0.50775124');
  });
});
