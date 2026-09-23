import type { ModelPricing } from '@pixpilot/cost-calculator';

/** Pricing and optional provider limits for the model behind an allocation. */
export interface CreditAllocationModel extends ModelPricing {
  /** Maximum combined input and output tokens for one request. */
  contextLength?: number | undefined;
  /** Maximum output tokens the provider accepts for one request. */
  maxOutputTokens?: number | undefined;
  /** Human-readable model name, when it is not carried in pricing metadata. */
  name?: string | undefined;
}
