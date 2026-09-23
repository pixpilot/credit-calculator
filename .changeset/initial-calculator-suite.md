---
'@pixpilot/cost-calculator': minor
'@pixpilot/cost-calculator-ui': minor
'@pixpilot/credit-usage-calculator': minor
'@pixpilot/credit-usage-calculator-ui': minor
'@pixpilot/credit-allocation-calculator': minor
'@pixpilot/credit-allocation-calculator-ui': minor
'@pixpilot/credit-pricing-calculator': minor
'@pixpilot/credit-pricing-calculator-ui': minor
'@pixpilot/credit-package-sizing-calculator': minor
'@pixpilot/credit-package-sizing-calculator-ui': minor
'@pixpilot/credit-package-margin-calculator': minor
'@pixpilot/credit-package-margin-calculator-ui': minor
---

Initial release of the credit calculator suite, moved out of the roleclick monorepo.

Six calculators, each answering one question, with a React UI package beside each:

- `cost-calculator` — what one operation costs us to run.
- `credit-allocation-calculator` — how that cost spreads across the credits an administrator assigns.
- `credit-pricing-calculator` — what one credit must sell for to reach a target gross margin.
- `credit-package-sizing-calculator` — how many credits a package price may include, and what it earns.
- `credit-package-margin-calculator` — what margin the packages already on sale earn.
- `credit-usage-calculator` — what a customer's credit balance buys them.
