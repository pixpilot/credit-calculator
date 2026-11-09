---
'@pixpilot/cost-calculator-ui': minor
'@pixpilot/credit-allocation-calculator-ui': minor
'@pixpilot/credit-package-margin-calculator-ui': minor
'@pixpilot/credit-package-sizing-calculator-ui': minor
'@pixpilot/credit-pricing-calculator-ui': minor
'@pixpilot/credit-usage-calculator-ui': minor
'@pixpilot/credit-allocation-calculator': patch
'@pixpilot/credit-package-sizing-calculator': patch
'@pixpilot/credit-pricing-calculator': patch
---

Make `@pixpilot/shadcn` (`^2.4.1`) and `@pixpilot/shadcn-ui` (`^3.20.1`) peer dependencies of the UI packages, so they share the app's copy instead of installing their own (an old nested `shadcn-ui` 3.20.0 left tiptap's `@floating-ui/dom` peer unmet). Consumers must now install them themselves.

Sibling `@pixpilot/*` packages are now declared with `workspace:^`, so they publish as a caret range instead of an exact pin and dedupe with the app's copy.
