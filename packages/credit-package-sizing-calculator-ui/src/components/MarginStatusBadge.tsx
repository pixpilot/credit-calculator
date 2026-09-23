'use client';

import type { MarginStatus } from '@pixpilot/credit-package-sizing-calculator';
import type { ReactNode } from 'react';

import { CircleAlert, CircleCheck, CircleHelp, TriangleAlert } from 'lucide-react';

/**
 * How a margin reads against its target, said in words and drawn with an icon.
 *
 * Colour carries none of the meaning on its own. A margin that is failing has
 * to be legible to someone who cannot tell this screen's green from its red,
 * so every state names itself and brings its own shape.
 */
const STATUS_PRESENTATION: Record<
  MarginStatus,
  { className: string; Icon: typeof CircleCheck; label: string }
> = {
  acceptable: {
    className: 'text-amber-700 dark:text-amber-400',
    Icon: CircleAlert,
    label: 'Acceptable',
  },
  'below-target': {
    className: 'text-destructive',
    Icon: TriangleAlert,
    label: 'Below target',
  },
  healthy: {
    className: 'text-emerald-700 dark:text-emerald-400',
    Icon: CircleCheck,
    label: 'Healthy',
  },
  unknown: {
    className: 'text-muted-foreground',
    Icon: CircleHelp,
    label: 'Not calculable',
  },
};

const ICON_SIZE = 14;

export interface MarginStatusBadgeProps {
  className?: string | undefined;
  status: MarginStatus;
}

/** The named state of one margin, as an icon and its label. */
export function MarginStatusBadge({
  className,
  status,
}: MarginStatusBadgeProps): ReactNode {
  const { className: statusClassName, Icon, label } = STATUS_PRESENTATION[status];

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${statusClassName} ${className ?? ''}`}
    >
      <Icon aria-hidden="true" size={ICON_SIZE} />
      {label}
    </span>
  );
}
