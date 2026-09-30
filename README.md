# BUYBACKBEAST

An open-source research workspace for ranking crypto tokens by value returned to holders versus forward unlock pressure.

[![verify](https://github.com/buybackbeast/buybackbeast/actions/workflows/verify.yml/badge.svg)](https://github.com/buybackbeast/buybackbeast/actions/workflows/verify.yml)

[Open the live demo](https://buybackbeast.github.io/buybackbeast/) · [Read the methodology](docs/methodology.md) · [Contribute sourced data](https://github.com/buybackbeast/buybackbeast/issues/2)

BUYBACKBEAST puts executed buybacks, protocol-funded burns, holder distributions, and forward unlocks on one comparable USD basis. Researchers can inspect matched 7-day, 30-day, 90-day, 180-day, or 365-day windows. The default remains 365 days, and every input and adjustment is visible.

## Why this exists

A large buyback headline says little on its own. The same program can be meaningful for a $300 million token and immaterial for a $30 billion token. It can also be overwhelmed by team and investor unlocks.

BUYBACKBEAST answers four questions:

1. How much value was actually captured over the last 12 months?
2. What percentage of circulating market capitalization does that represent?
3. How much token value is scheduled to unlock over the selected forward window?
4. Does value capture cover that dilution?

## Core methodology

All values use USD and a consistent measurement date.

```text
effective buybacks = executed buybacks × destination factor

effective value capture = effective buybacks
                        + direct economic burns
                        + holder distributions

horizon capture = annualized effective value capture × selected days ÷ 365

forward release pressure = selected-window unlock value
                         + selected-window inflationary emissions

net value capture = horizon capture − forward release pressure

horizon capture yield = horizon capture ÷ circulating market cap

release dilution = forward release pressure ÷ circulating market cap

net capture yield = net value capture ÷ circulating market cap

release coverage = horizon capture ÷ forward release pressure
```

The default table ranks the 365-day window by net capture yield, then unlock coverage, then capture yield. Selecting 7, 30, 90, or 180 days recalculates both capture and release pressure over that same window. There is no hidden composite score.

### What counts

- **Executed buybacks:** Tokens acquired with protocol or product cash flow during the trailing 12 months.
- **Direct economic burns:** Tokens destroyed through fee-funded or revenue-funded mechanisms, excluding tokens already counted as bought and burned.
- **Holder distributions:** Cash, stablecoins, or other assets distributed to token holders.
- **Forward unlocks and emissions:** Cumulative USD values for tokens scheduled to enter circulation within 7, 30, 90, 180, and 365 days of the data date.
- **Announced buybacks:** Displayed for context and excluded from ranking until executed.

### Destination factors

An executed buyback does not always remove supply permanently. BUYBACKBEAST therefore exposes adjustable destination factors. Bought-and-burned or irrevocably locked tokens count at 100% by default, while tokens held in a reusable treasury count at 0% until retired. The settings and resulting rank changes remain visible.

## Features

- Sortable token ranking with gross yield, unlock dilution, net yield, and coverage
- Explicit 7-day, 30-day, 90-day, 180-day, and 365-day release-window comparison, with 365 days as the default
- Separate executed and announced buyback amounts
- Explicit protection against bought-and-burned double counting
- Editable buyback destination factors
- Evidence and mechanism filters
- Source-linked, read-only research table with hourly CoinMarketCap snapshots and separate release data
- Token add and edit workflow with source URLs and measurement dates
- CSV and JSON import and export
- Local browser storage with no account, wallet, or API key
- Shareable view state
- Responsive desktop and mobile interface
- Unit-tested calculations and automated GitHub checks

No fictional ranking data is bundled. GitHub Actions refreshes the research table's CoinMarketCap circulating-market-cap snapshot every hour and redeploys the static site. The browser checks the deployed payload every five minutes, while unlock and emissions data remain separately sourced. These records are read-only and remain separate from editable ranking rows; users can add or import fully sourced observations for calculation.

The hourly schedule runs at minute 17 to avoid GitHub Actions' busiest queue window. Scheduled runs are best-effort rather than an exact service-level guarantee, and GitHub may disable schedules on a public repository after 60 days without repository activity.

The source-linked candidate universe currently covers UNI, HYPE, PUMP, CAKE, INJ, LIT, ASTER, SKY, PENDLE, BANANA, BIFI, DYDX, GMX, JUP, RAY, LINK, SYRUP, and COW. CeFi exchange tokens and previously rejected FORM, AAVE, and GNS leads are not included. Treasury-held or recycled purchases remain visible for research but receive a zero destination factor by default.

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

BUYBACKBEAST follows a few strict rules to keep comparisons useful:

- Use executed amounts for the trailing period. Keep budgets and promises separate.
- Never count the same bought-and-burned tokens as both buybacks and direct burns.
- State the period and measurement date for every USD figure.
- Enter cumulative 7-day, 30-day, 90-day, 180-day, and 365-day release values independently. Never estimate a shorter window by prorating a longer-window total.
- Value forward unlocks with the same token price used for market capitalization.
- Record source URLs and disclose estimates or annualization.
- Treat treasury-held tokens differently from permanently removed supply.
- Read-only research candidates are not ranking inputs. Missing market-cap, capture, unlock, or emissions data must remain unknown until sourced rather than being replaced with placeholder zeroes.
- Treat a provider's completed original vesting schedule separately from later treasury vesting contracts or governance-authorized releases.

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

If BUYBACKBEAST is useful for your research, star the repository so more crypto researchers can discover it.

## License

MIT
