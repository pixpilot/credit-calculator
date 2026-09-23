# Credit Calculator

> A modern TypeScript monorepo managed with pnpm and TurboRepo.

## 🚀 Getting Started

### Development

Build all packages:

```sh
pnpm build
```

Run tests:

```sh
pnpm test
```

Lint and format:

```sh
pnpm lint
pnpm format
```

### Create a New Package

Generate a new package in the monorepo:

```sh
pnpm run gen:package
```

## 📦 Packages

### [cost-calculator](./packages/cost-calculator/README.md)

What an operation costs to run: token estimates priced at a model, plus fixed infrastructure cost, in exact decimal money.

### [cost-calculator-ui](./packages/cost-calculator-ui/README.md)

React UI for @pixpilot/cost-calculator.

### [credit-allocation-calculator](./packages/credit-allocation-calculator/README.md)

How many credits each operation charges, what one credit costs the business to honour, and what it earns under a given pricing scenario.

### [credit-allocation-calculator-ui](./packages/credit-allocation-calculator-ui/README.md)

React UI for @pixpilot/credit-allocation-calculator.

### [credit-package-margin-calculator](./packages/credit-package-margin-calculator/README.md)

What margin each credit package on sale earns, at the blended and at the worst-case cost per credit.

### [credit-package-margin-calculator-ui](./packages/credit-package-margin-calculator-ui/README.md)

React UI for @pixpilot/credit-package-margin-calculator.

### [credit-package-sizing-calculator](./packages/credit-package-sizing-calculator/README.md)

How many credits a credit package price may include while holding a target margin, with the package size, subscription bonus and free allowance those limits argue for.

### [credit-package-sizing-calculator-ui](./packages/credit-package-sizing-calculator-ui/README.md)

React UI for @pixpilot/credit-package-sizing-calculator.

### [credit-pricing-calculator](./packages/credit-pricing-calculator/README.md)

The least one credit can sell for and still hold a target gross margin.

### [credit-pricing-calculator-ui](./packages/credit-pricing-calculator-ui/README.md)

React UI for @pixpilot/credit-pricing-calculator.

### [credit-usage-calculator](./packages/credit-usage-calculator/README.md)

What a credit balance buys: credits spent, credits left, and what the remainder is worth in each feature.

### [credit-usage-calculator-ui](./packages/credit-usage-calculator-ui/README.md)

React UI for @pixpilot/credit-usage-calculator.


## 🚢 Releases

This project uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

## 📄 License

[MIT](LICENSE)
