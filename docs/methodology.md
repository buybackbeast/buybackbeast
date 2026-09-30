# Methodology

BUYBACKBEAST compares backward-looking value capture with forward-looking dilution. It is a research framework, so the inputs, adjustments, and limitations remain visible.

## Measurement windows

- An official result uses actual value capture from the trailing 365 days ending on the dataset's `as of` date.
- A dataset with 90 to 364 consecutive days can show an annualized recurring run rate, but the result is labeled provisional.
- The release window can be 90, 180, or 365 days beginning on that same date. The default is 365 days.
- Annualized effective capture is scaled to the selected release window before net yield and coverage are calculated.
- Market capitalization, FDV, and unlock value should use the same token price and timestamp.

Mixing periods can distort the result. BUYBACKBEAST therefore compares a 90-day capture run rate with 90-day releases, a 180-day run rate with 180-day releases, and a 365-day run rate with 365-day releases. A shorter capture observation period can be annualized, but it remains labeled provisional. One-off burns and capital returns are never annualized.

## Value-capture inputs

### Executed buybacks

Count tokens actually purchased with protocol revenue, fees, or other recurring product cash flow. Exclude an unspent authorization or announced budget.

If a protocol reports tokens rather than USD, multiply each purchase by its execution price. A single current price can materially misstate historical cash deployed.

### Direct economic burns

Count a burn when economic activity removes existing token value, such as a portion of protocol fees used to burn tokens. Do not count administrative burns, migrations, mistaken mints, or the burn leg of a buy-and-burn program already included under executed buybacks.

### Holder distributions

Count cash or assets paid to token holders or eligible stakers. Incentive emissions funded by newly issued tokens do not count as value capture.

### Buyback destination

The destination determines how durable a buyback is:

| Destination | Default factor | Reason |
| --- | ---: | --- |
| Burned | 100% | Supply is permanently removed |
| Permanently locked | 100% | Supply cannot return to circulation |
| Protocol treasury | 0% | Tokens remain reusable and can return to circulation |
| Recycled as incentives | 0% | Tokens are scheduled to return to circulation |

These factors are explicit assumptions, not facts. Users can change them and observe the ranking update immediately.

## Unlock input

Forward release pressure includes team, investor, treasury, ecosystem, and other previously non-circulating allocations expected to become transferable during the selected 90-day, 180-day, or 365-day window. It also includes inflationary emissions expected under the current protocol rules.

```text
unlock value = unlocked token amount × measurement-date token price

emission value = newly issued token amount × measurement-date token price

release pressure = unlock value + emission value
```

Each horizon is cumulative from the data date. Known values should satisfy `90d ≤ 180d ≤ 365d` separately for unlocks and emissions. BUYBACKBEAST never prorates a 365-day total to estimate a shorter horizon because unlock schedules are often uneven.

Release pressure measures potential dilution, not guaranteed selling. BUYBACKBEAST subtracts it to provide a conservative comparison with value capture over the same period. If either forward component is unknown for the selected horizon, the token is marked `NR` instead of treating missing data as zero. Missing data at another horizon does not prevent ranking the selected one.

## Ranking formulas

For token `i`:

```text
effective_buybacks_i = executed_buybacks_i × destination_factor_i

annualized_capture_i = effective_buybacks_i
                     + direct_burns_i
                     + holder_distributions_i

horizon_capture_i = annualized_capture_i × selected_days / 365

net_capture_i = horizon_capture_i − forward_release_pressure_i

capture_yield_i = horizon_capture_i / circulating_market_cap_i

release_dilution_i = forward_release_pressure_i / circulating_market_cap_i

net_yield_i = net_capture_i / circulating_market_cap_i

coverage_i = horizon_capture_i / forward_release_pressure_i
```

Tokens sort by `net_yield` from highest to lowest. Ties sort by `coverage`, then `capture_yield`, then symbol. When release pressure is zero and horizon capture is positive, coverage is shown as unlimited. Tokens with incomplete data for the selected horizon remain visible but unranked. The 365-day selection exactly preserves the original ranking semantics because its horizon factor is 1.

## Worked example

Assume the default 365-day window and a token has:

- $1.0 billion circulating market cap
- $1.6 billion FDV
- $80 million of executed buybacks, all burned
- $5 million of direct fee burns unrelated to the buybacks
- $10 million of holder distributions
- $45 million of unlocks and $5 million of emissions scheduled over the next 12 months

Then:

```text
gross capture = $80m + $5m + $10m = $95m
gross capture yield = $95m / $1,000m = 9.5%
release dilution = ($45m + $5m) / $1,000m = 5.0%
net value capture = $95m − $50m = $45m
net capture yield = $45m / $1,000m = 4.5%
unlock coverage = $95m / $50m = 1.9×
```

If the same buybacks were held in a reusable treasury, the default core methodology would assign them no durable capture until retirement. Net capture yield would therefore fall to -3.5%.

## Evidence labels

Evidence labels help readers judge input quality but do not alter the rank:

- **Onchain:** Reconciled transactions or a reproducible onchain dashboard
- **Official:** Executed figures in a protocol report or governance disclosure
- **Third party:** A reputable data provider with a stated methodology
- **Estimate:** A disclosed calculation or annualization
- **Announcement:** A future intention, excluded from executed value capture

## Research candidates

A research candidate is a mechanism-qualified lead, not a ranking observation. Candidate records, dated CoinMarketCap circulating-market-cap snapshots, and separately sourced release snapshots are presented in a read-only research table. They do not enter local storage, exports, aggregate metrics, or `rankTokens()`.

The compact table is designed for comparison, while expandable details retain the mechanism explanation, caveats, measurement date, and sources. Unknown values are displayed as unavailable and must never be replaced with placeholder zeroes to manufacture a score.

The table uses CoinMarketCap as the single market-cap provider for all 18 candidates. Each record stores its CoinMarketCap ID, canonical slug, source page, and a shared conservative timestamp equal to the oldest underlying quote in the batch. GitHub Actions requests all IDs from CoinMarketCap's keyless API once per hour, validates complete coverage, identity mappings, freshness, and positive finite values, then atomically replaces the static payload before deployment. If retrieval or validation fails, deployment stops and the previous verified site remains live. Market-cap snapshots remain separate from release schedules so a market-data refresh cannot silently change unlock calculations.

For Uniswap specifically, the bundled fallback snapshot records a $5.480 billion CoinMarketCap circulating market capitalization. The hourly payload replaces that display value when available. DefiLlama marks 100% completion of the original allocation vesting. The separate $9.07 valuation price is retained only to reproduce the previously verified UNIVesting release amounts and is not used as the table's market-cap source.

The separate UNIVesting contract releases UNI on calendar-quarter boundaries. At Ethereum block 26,091,194 on September 30, 2026, its quarterly amount was still 5 million UNI, its last-unlock boundary was July 1, and the treasury owner had 25 million UNI of allowance remaining. Using the half-open interval `(snapshot date, horizon end]`, the snapshot includes 5 million UNI over 90 days, 10 million over 180 days, and 20 million over 365 days. At $9.07, those values are $45.35 million, $90.70 million, and $181.40 million. The allowance can be revoked and the quarterly amount can be changed under the contract rules, so these are scheduled pressure rather than guaranteed sales. Current official UNI documentation reports no active inflation, so the snapshot records verified zero inflationary emissions separately from treasury releases.

The fixed-block JSON-RPC requests and raw responses used for that state check are committed at [`docs/evidence/uniswap-univesting-2026-09-30.json`](evidence/uniswap-univesting-2026-09-30.json), including the owner and `allowance(owner, vesting)` calldata.

Put the USD value of UNI actually burned in executed Firepit or other configured releaser transactions in `recurringDirectBurnsUsdInPeriod`, valued at each burn timestamp. Do not substitute gross protocol fees or TokenJar balances, and do not enter the same activity as an executed buyback. The 100 million UNI retroactive treasury burn is a one-off context item and must not be annualized.

## Limitations

- An unlock does not imply an immediate sale.
- A buyback does not guarantee permanent supply reduction.
- Market prices can change substantially during the forward unlock window.
- Revenue-funded buybacks may be discretionary and may not continue.
- Cross-token tax, legal, governance, and staking differences are outside the formula.
- A positive net yield is one research input, not a complete valuation model.
