# ValueBeast

An open-source research workspace for ranking crypto tokens by value returned to holders versus forward unlock pressure.

ValueBeast puts executed buybacks, protocol-funded burns, holder distributions, and the next 12 months of unlocks on one comparable USD basis. The default ranking is transparent: tokens are ordered by net value-capture yield, with every input and adjustment visible.

## Why this exists

A large buyback headline says little on its own. The same program can be meaningful for a $300 million token and immaterial for a $30 billion token. It can also be overwhelmed by team and investor unlocks.

ValueBeast answers four questions:

1. How much value was actually captured over the last 12 months?
2. What percentage of circulating market capitalization does that represent?
3. How much token value is scheduled to unlock over the next 12 months?
4. Does value capture cover that dilution?

## Core methodology

All values use USD and a consistent measurement date.

```text
effective buybacks = executed buybacks × destination factor

gross value capture = effective buybacks
                    + direct economic burns
                    + holder distributions

forward release pressure = next 12 month unlock value
                         + next 12 month inflationary emissions

net value capture = gross value capture − forward release pressure

gross capture yield = gross value capture ÷ circulating market cap

release dilution = forward release pressure ÷ circulating market cap

net capture yield = net value capture ÷ circulating market cap

release coverage = gross value capture ÷ forward release pressure
```

The default table ranks by net capture yield, then unlock coverage, then gross capture yield. There is no hidden composite score.

### What counts

- **Executed buybacks:** Tokens acquired with protocol or product cash flow during the trailing 12 months.
- **Direct economic burns:** Tokens destroyed through fee-funded or revenue-funded mechanisms, excluding tokens already counted as bought and burned.
- **Holder distributions:** Cash, stablecoins, or other assets distributed to token holders.
- **Forward unlocks and emissions:** The USD value of tokens scheduled to enter circulation over the next 12 months.
- **Announced buybacks:** Displayed for context and excluded from ranking until executed.

### Destination factors

An executed buyback does not always remove supply permanently. ValueBeast therefore exposes adjustable destination factors. Bought-and-burned or irrevocably locked tokens count at 100% by default, while tokens held in a reusable treasury count at 0% until retired. The settings and resulting rank changes remain visible.

## Features

- Sortable token ranking with gross yield, unlock dilution, net yield, and coverage
- Separate executed and announced buyback amounts
- Explicit protection against bought-and-burned double counting
- Editable buyback destination factors
- Evidence and mechanism filters
- Token add and edit workflow with source URLs and measurement dates
- CSV and JSON import and export
- Local browser storage with no account, wallet, or API key
- Shareable view state
- Responsive desktop and mobile interface
- Unit-tested calculations and automated GitHub checks

The bundled dataset is fictional and exists only to demonstrate the calculations. Replace it with sourced data before using the output for research.

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verify changes

```bash
npm run lint
npm test
npm run build
```

## Data rules

ValueBeast follows a few strict rules to keep comparisons useful:

- Use executed amounts for the trailing period. Keep budgets and promises separate.
- Never count the same bought-and-burned tokens as both buybacks and direct burns.
- State the period and measurement date for every USD figure.
- Value forward unlocks with the same token price used for market capitalization.
- Record source URLs and disclose estimates or annualization.
- Treat treasury-held tokens differently from permanently removed supply.

See [the methodology](docs/methodology.md) for edge cases and a worked example.

## Roadmap

- Curated, source-linked token snapshots
- Historical ranking snapshots and trend charts
- Unlock schedule import with price sensitivity
- Protocol revenue and buyback sustainability metrics
- Community-reviewed data updates
- Korean interface

## Contributing

Calculation fixes and well-sourced data updates are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## License

MIT
