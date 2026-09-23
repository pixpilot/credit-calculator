import { useCallback, useId, useRef } from 'react';

import { useCreditPackagePricingState } from './use-credit-package-pricing-state.ts';

export interface UseIdentifiedRowsOptions<TRow extends { id: string }> {
  /** Builds the blank row an administrator starts filling in. */
  createRow: (id: string) => TRow;
  defaultValue: TRow[];
  onChange?: ((rows: TRow[]) => void) | undefined;
  value?: TRow[] | undefined;
}

export interface IdentifiedRows<TRow extends { id: string }> {
  add: () => void;
  remove: (rowId: string) => void;
  rows: TRow[];
  update: (rowId: string, changes: Partial<TRow>) => void;
}

/**
 * An editable table of rows that keep their identity as they are edited.
 *
 * Rows are addressed by id rather than by position, so renaming a feature or
 * removing one above it never moves an edit onto its neighbour. New ids come
 * from React's own instance-scoped id, so two calculators on one page cannot
 * mint the same one.
 */
export function useIdentifiedRows<TRow extends { id: string }>({
  createRow,
  defaultValue,
  onChange,
  value,
}: UseIdentifiedRowsOptions<TRow>): IdentifiedRows<TRow> {
  const idPrefix = useId();
  const nextRowNumber = useRef(0);
  const { update: setRows, value: rows } = useCreditPackagePricingState<TRow[]>({
    defaultValue,
    onChange,
    value,
  });

  const add = useCallback(() => {
    nextRowNumber.current += 1;

    const newRow = createRow(`${idPrefix}row-${nextRowNumber.current}`);

    setRows((currentRows) => [...currentRows, newRow]);
  }, [createRow, idPrefix, setRows]);

  const remove = useCallback(
    (rowId: string) => {
      setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
    },
    [setRows],
  );

  const update = useCallback(
    (rowId: string, changes: Partial<TRow>) => {
      setRows((currentRows) =>
        currentRows.map((row) => (row.id === rowId ? { ...row, ...changes } : row)),
      );
    },
    [setRows],
  );

  return { add, remove, rows, update };
}
