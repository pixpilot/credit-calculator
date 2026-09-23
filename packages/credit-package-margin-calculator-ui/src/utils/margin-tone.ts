import type { MarginStatus } from '@pixpilot/credit-package-margin-calculator';

/**
 * How each margin status reads, in words and in colour.
 *
 * The word is not decoration: a margin that only differs by hue is unreadable
 * to a reader who cannot separate the two, and unreadable in a screenshot
 * pasted into a document. Every coloured figure on the screen carries its
 * status in text as well.
 */
const MARGIN_TONES: Record<MarginStatus, { className: string; label: string }> = {
  'below-target': { className: 'text-red-400', label: 'below target' },
  'near-target': { className: 'text-amber-400', label: 'under target' },
  'on-target': { className: 'text-emerald-400', label: 'on target' },
  unknown: { className: 'text-muted-foreground', label: 'not priced' },
};

export function marginTone(status: MarginStatus): { className: string; label: string } {
  return MARGIN_TONES[status];
}
