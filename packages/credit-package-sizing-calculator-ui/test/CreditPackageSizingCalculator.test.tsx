import type { CreditPricingFeatureInput } from '@pixpilot/credit-package-sizing-calculator';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CreditPackageSizingCalculator } from '../src/index.ts';

const defaultValue: readonly CreditPricingFeatureInput[] = [
  {
    creditsPerExecution: 5,
    fixedCostName: 'Worker execution',
    fixedCostPerExecution: 0.000002,
    inputTokens: 15_000,
    name: 'AI Job Insights',
    outputTokens: 1_000,
    quantity: 100,
  },
  {
    creditsPerExecution: 2,
    fixedCostName: 'PDF rendering',
    fixedCostPerExecution: 0.0005,
    name: 'Resume Export',
    quantity: 50,
  },
];

function figure(label: string): string {
  const term = screen.getAllByText(label)[0];

  return term?.nextElementSibling?.textContent ?? '';
}

function card(label: string): HTMLElement {
  const heading = screen.getAllByText(label)[0]?.parentElement;

  if (heading == null) throw new Error(`No card for "${label}"`);

  return heading;
}

function featureRow(name: string): HTMLElement {
  const row = screen.getByDisplayValue(name).closest('tr');

  if (row == null) throw new Error(`No row for "${name}"`);

  return row;
}

describe('credit pricing calculator', () => {
  it('should render every supplied feature with its editable figures', () => {
    render(<CreditPackageSizingCalculator defaultValue={defaultValue} />);

    expect(screen.getByLabelText('Credits per action for AI Job Insights')).toHaveValue(
      5,
    );
    expect(screen.getByLabelText('Expected runs for AI Job Insights')).toHaveValue(100);
    expect(screen.getByLabelText('Input tokens for AI Job Insights')).toHaveValue(15_000);
    expect(screen.getByLabelText('Output tokens for Resume Export')).toHaveValue(0);
  });

  it('should compute the per-action and per-credit costs beside them', () => {
    render(<CreditPackageSizingCalculator defaultValue={defaultValue} />);

    const cells = within(featureRow('AI Job Insights')).getAllByRole('cell');

    expect(cells.map((cell) => cell.textContent)).toContain('$0.004202');
    expect(cells.map((cell) => cell.textContent)).toContain('$0.000840');
  });

  it('should total the expected cost and credits under the rows', () => {
    render(<CreditPackageSizingCalculator defaultValue={defaultValue} />);

    const totals = within(screen.getAllByRole('table')[0]!).getByText('Expected totals');

    expect(totals.parentElement?.textContent).toContain('600');
  });

  it('should show the margins the current package earns', () => {
    render(<CreditPackageSizingCalculator defaultValue={defaultValue} />);

    expect(card('Expected margin').textContent).toContain('%');
    expect(card('Worst-case margin').textContent).toContain('Healthy');
  });

  it('should recalculate immediately when a figure is edited', () => {
    render(<CreditPackageSizingCalculator defaultValue={defaultValue} />);

    const before = figure('Weighted average cost / credit');

    fireEvent.change(screen.getByLabelText('Input tokens for AI Job Insights'), {
      target: { value: '150000' },
    });

    expect(figure('Weighted average cost / credit')).not.toBe(before);
  });

  it('should recalculate immediately when an assumption is edited', () => {
    render(<CreditPackageSizingCalculator defaultValue={defaultValue} />);

    const before = figure('Buffered worst-case cost / credit');

    fireEvent.change(screen.getByLabelText('Safety buffer'), {
      target: { value: '50' },
    });

    expect(figure('Buffered worst-case cost / credit')).not.toBe(before);
  });

  it('should keep the last usable figure when an input is cleared', () => {
    render(<CreditPackageSizingCalculator defaultValue={defaultValue} />);

    const before = figure('Weighted average cost / credit');
    const runs = screen.getByLabelText('Expected runs for AI Job Insights');

    fireEvent.change(runs, { target: { value: '' } });

    expect(runs).toHaveValue(null);
    expect(figure('Weighted average cost / credit')).toBe(before);
  });

  it('should refuse a figure the calculator would reject', () => {
    render(<CreditPackageSizingCalculator defaultValue={defaultValue} />);

    const before = figure('Weighted average cost / credit');

    fireEvent.change(screen.getByLabelText('Credits per action for AI Job Insights'), {
      target: { value: '0' },
    });

    expect(figure('Weighted average cost / credit')).toBe(before);
  });

  it('should add and remove features by their own identity', () => {
    const onChange = vi.fn();

    render(
      <CreditPackageSizingCalculator defaultValue={defaultValue} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add feature' }));

    expect(screen.getByDisplayValue('New feature')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'new-feature' })]),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove AI Job Insights' }));

    expect(screen.queryByDisplayValue('AI Job Insights')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Resume Export')).toBeInTheDocument();
  });

  it('should compare package sizes at the same price', () => {
    render(<CreditPackageSizingCalculator defaultValue={defaultValue} />);

    const comparison = screen.getAllByRole('table')[1];
    const rows = within(comparison!).getAllByRole('row');

    expect(rows.at(1)?.textContent).toContain('500');
    expect(rows.at(-1)?.textContent).toContain('1,000');
  });

  it('should report an empty feature list without inventing a figure', () => {
    render(<CreditPackageSizingCalculator defaultValue={[]} />);

    expect(screen.getByText(/No features yet/u)).toBeInTheDocument();
    expect(figure('Weighted average cost / credit')).toBe('—');
    expect(screen.queryByText(/NaN|Infinity/u)).not.toBeInTheDocument();
  });

  it('should let a host control the features it supplied', () => {
    const onChange = vi.fn();

    render(
      <CreditPackageSizingCalculator
        defaultValue={defaultValue}
        value={defaultValue}
        onChange={onChange}
      />,
    );

    const credits = screen.getByLabelText('Credits per action for Resume Export');

    fireEvent.change(credits, { target: { value: '3' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ creditsPerExecution: 3, id: 'resume-export' }),
      ]),
    );

    // The host kept its own value, so blurring drops the draft and shows it.
    fireEvent.blur(credits);

    expect(credits).toHaveValue(2);
  });
});
