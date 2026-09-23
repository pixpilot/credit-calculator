import type {
  CreditPackageFeatureScenario,
  FeatureRow,
  PackageRow,
} from '@pixpilot/credit-package-margin-calculator';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreditPackageMarginCalculator } from '../src/index.ts';

/**
 * The shape an application's own cost scenarios already have. Passing them in
 * unchanged is the point of `defaultValue`.
 */
const scenarios: readonly CreditPackageFeatureScenario[] = [
  {
    creditsPerExecution: 5,
    fixedCostPerExecution: 0.000002,
    inputTokens: 15_000,
    name: 'AI Job Insights',
    outputTokens: 1_000,
    quantity: 100,
  },
  {
    creditsPerExecution: 2,
    fixedCostPerExecution: 0.0005,
    name: 'Resume Export',
    quantity: 50,
  },
];

const packages: PackageRow[] = [{ credits: 500, id: 'pack-5', price: 5 }];

function renderCalculator(): void {
  render(
    <CreditPackageMarginCalculator defaultPackages={packages} defaultValue={scenarios} />,
  );
}

function featureRow(name: string): HTMLElement {
  const cell = screen.getByDisplayValue(name).closest('tr');

  if (cell == null) throw new Error(`No feature row for "${name}"`);

  return cell;
}

function statCard(label: string): string {
  const container = screen.getByText(label).parentElement;

  return container?.children[1]?.textContent ?? '';
}

function first<TElement>(elements: readonly TElement[]): TElement {
  const [element] = elements;

  if (element == null) throw new Error('Expected at least one element');

  return element;
}

function packageRow(): HTMLElement {
  const table = screen.getByRole('table', { name: /credit packages/iu });
  return first(within(table).getAllByRole('row').slice(1));
}

describe('feature table', () => {
  it('should seed a row from every supplied scenario', () => {
    renderCalculator();

    expect(screen.getByDisplayValue('AI Job Insights')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Resume Export')).toBeInTheDocument();
  });

  it('should cost a run from the model rates and the fixed cost', () => {
    renderCalculator();

    expect(
      within(featureRow('AI Job Insights')).getByText('$0.004202'),
    ).toBeInTheDocument();
  });

  it('should fill in the estimates a scenario leaves out', () => {
    renderCalculator();

    const row = featureRow('Resume Export');

    expect(within(row).getByLabelText('Input tokens for Resume Export')).toHaveValue(0);
    expect(within(row).getByText('$0.000500')).toBeInTheDocument();
  });

  it('should recost a feature as its tokens are edited', () => {
    renderCalculator();

    fireEvent.change(screen.getByLabelText('Input tokens for AI Job Insights'), {
      target: { value: '30000' },
    });

    expect(
      within(featureRow('AI Job Insights')).getByText('$0.007202'),
    ).toBeInTheDocument();
  });

  it('should reprice every feature when a model rate changes', () => {
    renderCalculator();

    fireEvent.change(screen.getByLabelText('Input price per million tokens'), {
      target: { value: '0.4' },
    });

    expect(
      within(featureRow('AI Job Insights')).getByText('$0.007202'),
    ).toBeInTheDocument();
  });

  it('should keep the half-typed text a calculation would reject', () => {
    renderCalculator();

    const input = screen.getByLabelText('Runs a month for AI Job Insights');

    fireEvent.change(input, { target: { value: '' } });

    expect(input).toHaveValue(null);
    expect(
      within(featureRow('AI Job Insights')).getByText('$0.4202'),
    ).toBeInTheDocument();
  });

  it('should restore the figure in force once a half-typed field is left', () => {
    renderCalculator();

    const input = screen.getByLabelText('Runs a month for AI Job Insights');

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input).toHaveValue(100);
  });

  it('should not commit a figure past what the calculation will price', () => {
    renderCalculator();

    const input = screen.getByLabelText('Input tokens for AI Job Insights');

    fireEvent.change(input, { target: { value: '999999999999' } });

    expect(
      within(featureRow('AI Job Insights')).getByText('$0.004202'),
    ).toBeInTheDocument();
  });

  it('should survive a name cleared on the way to retyping it', () => {
    renderCalculator();

    const input = screen.getByLabelText('Name for AI Job Insights');

    fireEvent.change(input, { target: { value: '' } });

    expect(input).toHaveValue('');
    expect(statCard('Monthly cost')).toBe('$0.4452');

    fireEvent.change(input, { target: { value: 'Insights' } });

    expect(screen.getByLabelText('Name for Insights')).toBeInTheDocument();
  });

  it('should add a row that charges nothing until it is described', () => {
    renderCalculator();

    fireEvent.click(screen.getByRole('button', { name: 'Add feature' }));

    expect(screen.getByDisplayValue('New feature')).toBeInTheDocument();
    expect(statCard('Credits issued')).toBe('600');
  });

  it('should remove a row and drop its cost from the totals', () => {
    renderCalculator();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Resume Export' }));

    expect(screen.queryByDisplayValue('Resume Export')).not.toBeInTheDocument();
    expect(statCard('Credits issued')).toBe('500');
  });
});

describe('summary strip', () => {
  it('should report the month, its credits and both costs per credit', () => {
    renderCalculator();

    expect(statCard('Monthly cost')).toBe('$0.4452');
    expect(statCard('Credits issued')).toBe('600');
    expect(statCard('Blended $ / credit')).toBe('$0.000742');
    expect(statCard('Worst-case $ / credit')).toBe('$0.0008404');
  });

  it('should name the feature the worst case belongs to', () => {
    renderCalculator();

    expect(screen.getByText('Worst-case $ / credit').parentElement).toHaveTextContent(
      'AI Job Insights',
    );
  });

  it('should move the worst case as the mix is edited', () => {
    renderCalculator();

    fireEvent.change(screen.getByLabelText('Fixed cost for Resume Export'), {
      target: { value: '0.01' },
    });

    expect(screen.getByText('Worst-case $ / credit').parentElement).toHaveTextContent(
      'Resume Export',
    );
  });
});

describe('package table', () => {
  it('should report both margins and both credit ceilings', () => {
    renderCalculator();

    const row = within(packageRow());

    expect(row.getByText('92.58%')).toBeInTheDocument();
    expect(row.getByText('91.60%')).toBeInTheDocument();
  });

  it('should take the processor fee out of revenue once it is switched on', () => {
    renderCalculator();

    fireEvent.click(screen.getByRole('switch'));

    const row = within(packageRow());

    expect(row.getByText('$0.445')).toBeInTheDocument();
    expect(row.getByText('$4.555')).toBeInTheDocument();
  });

  it('should name every margin as well as colour it', () => {
    renderCalculator();

    expect(within(packageRow()).getAllByText('on target')).toHaveLength(2);
  });

  it('should fall below the target once a package hands over too many credits', () => {
    renderCalculator();

    fireEvent.change(screen.getByLabelText('Credits in the $5.00 package'), {
      target: { value: '5000' },
    });

    expect(within(packageRow()).getAllByText('below target')).toHaveLength(2);
  });

  it('should suggest fewer credits as the target margin rises', () => {
    renderCalculator();

    const suggestedAtTarget = (): string =>
      within(packageRow()).getAllByRole('cell').at(-2)?.textContent ?? '';
    const before = suggestedAtTarget();

    fireEvent.change(screen.getByLabelText('Target margin'), { target: { value: '90' } });

    expect(suggestedAtTarget()).not.toBe(before);
  });

  it('should add and remove packages', () => {
    renderCalculator();

    fireEvent.click(screen.getByRole('button', { name: 'Add package' }));

    expect(screen.getAllByLabelText(/^Price for the/u)).toHaveLength(2);

    fireEvent.click(first(screen.getAllByRole('button', { name: /^Remove the/u })));

    expect(screen.getAllByLabelText(/^Price for the/u)).toHaveLength(1);
  });
});

describe('controlled use', () => {
  it('should report edited features to the host rather than keep them', () => {
    const onChange = vi.fn<(features: FeatureRow[]) => void>();
    const value: FeatureRow[] = [
      {
        creditCost: 5,
        fixedCost: 0,
        id: 'insights',
        inputTokens: 15_000,
        name: 'AI Job Insights',
        outputTokens: 1_000,
        quantity: 100,
      },
    ];

    render(<CreditPackageMarginCalculator value={value} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Credits per run for AI Job Insights'), {
      target: { value: '10' },
    });

    expect(onChange).toHaveBeenCalledWith([{ ...first(value), creditCost: 10 }]);
  });
});
