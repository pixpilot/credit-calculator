'use client';

import type { CalculatedCostPath, CostPath } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pixpilot/shadcn';
import { Trash2 } from 'lucide-react';
import { FixedCostFields } from './FixedCostFields.tsx';
import { TokenCostFields } from './TokenCostFields.tsx';

export interface CostPathEditorProps {
  canRemove: boolean;
  path: CostPath;
  result: CalculatedCostPath;
  onChange: (path: CostPath) => void;
  onRemove: () => void;
}

/** Coordinates common path controls with the matching fixed or token-specific fields. */
export function CostPathEditor({
  canRemove,
  path,
  result,
  onChange,
  onRemove,
}: CostPathEditorProps): ReactNode {
  const updateNumber = (key: string, value: string) => {
    const numericValue = Number(value);
    const safeValue =
      Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
    onChange({ ...path, [key]: safeValue });
  };

  const changeType = (type: 'fixed' | 'tokens') => {
    if (type === 'fixed') {
      onChange({ costPerExecution: 0, name: path.name, type });
      return;
    }

    onChange({ inputTokens: 0, name: path.name, outputTokens: 0, type });
  };

  return (
    <div className="grid gap-4 border-t pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-52 flex-1 gap-2">
          <Label htmlFor={`path-name-${path.name}`}>Cost path</Label>
          <Input
            id={`path-name-${path.name}`}
            value={path.name}
            onChange={(event) => {
              if (event.target.value.trim().length > 0) {
                onChange({ ...path, name: event.target.value });
              }
            }}
          />
        </div>
        <div className="grid w-44 gap-2">
          <Label>Type</Label>
          <Select
            value={path.type}
            onValueChange={(value) => changeType(value as 'fixed' | 'tokens')}
          >
            <SelectTrigger aria-label={`Type for ${path.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed cost</SelectItem>
              <SelectItem value="tokens">Token pricing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          aria-label={`Remove ${path.name} path`}
          disabled={!canRemove}
          size="icon"
          title="Remove cost path"
          variant="ghost"
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      {path.type === 'tokens' && result.type === 'tokens' ? (
        <TokenCostFields path={path} result={result} onNumberChange={updateNumber} />
      ) : (
        <FixedCostFields
          costPerExecution={path.type === 'fixed' ? path.costPerExecution : 0}
          pathName={path.name}
          result={result}
          onChange={(value) => updateNumber('costPerExecution', value)}
        />
      )}
    </div>
  );
}
