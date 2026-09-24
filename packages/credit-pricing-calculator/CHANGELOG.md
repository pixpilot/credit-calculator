# @pixpilot/credit-pricing-calculator

## 0.1.0

### Minor Changes

- adds credit calcualtor packages
- 51c8f16: Initial release of the credit calculator suite, moved out of the roleclick monorepo.

  Six calculators, each answering one question, with a React UI package beside each:

  - `cost-calculator` — what one operation costs us to run.
  - `credit-allocation-calculator` — how that cost spreads across the credits an administrator assigns.
  - `credit-pricing-calculator` — what one credit must sell for to reach a target gross margin.
  - `credit-package-sizing-calculator` — how many credits a package price may include, and what it earns.
  - `credit-package-margin-calculator` — what margin the packages already on sale earn.
  - `credit-usage-calculator` — what a customer's credit balance buys them.

### Patch Changes

- Updated dependencies
- Updated dependencies [51c8f16]
  - @pixpilot/cost-calculator@0.1.0
