# Methodology

ValueBeast compares backward-looking value capture with forward-looking dilution. It is a research framework, so the inputs, adjustments, and limitations remain visible.

## Measurement windows

- An official result uses actual value capture from the trailing 365 days ending on the dataset's `as of` date.
- A dataset with 90 to 364 consecutive days can show an annualized recurring run rate, but the result is labeled provisional.
- Unlock value uses the next 365 days beginning on that same date.
- Market capitalization, FDV, and unlock value should use the same token price and timestamp.

Mixing periods can distort the result. A quarterly buyback should not be compared directly with a full year of releases unless it is clearly annualized and labeled provisional. One-off burns and capital returns are never annualized.

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

Forward release pressure includes team, investor, treasury, ecosystem, and other previously non-circulating allocations expected to become transferable during the next 365 days. It also includes inflationary emissions expected under the current protocol rules.

```text
unlock value = unlocked token amount × measurement-date token price

emission value = newly issued token amount × measurement-date token price

release pressure = unlock value + emission value
```

Release pressure measures potential dilution, not guaranteed selling. ValueBeast subtracts it to provide a conservative comparison with value capture. If either forward component is unknown, the token is marked `NR` instead of treating missing data as zero.

## Ranking formulas

For token `i`:

```text
effective_buybacks_i = executed_buybacks_i × destination_factor_i

gross_capture_i = effective_buybacks_i
                + direct_burns_i
                + holder_distributions_i

net_capture_i = gross_capture_i − forward_release_pressure_i

gross_yield_i = gross_capture_i / circulating_market_cap_i

release_dilution_i = forward_release_pressure_i / circulating_market_cap_i

net_yield_i = net_capture_i / circulating_market_cap_i

coverage_i = gross_capture_i / forward_release_pressure_i
```

Tokens sort by `net_yield` from highest to lowest. Ties sort by `coverage`, then `gross_yield`, then symbol. When release pressure is zero and gross capture is positive, coverage is shown as unlimited. Tokens with incomplete forward data remain visible but unranked.

## Worked example

Assume a token has:

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

## Limitations

- An unlock does not imply an immediate sale.
- A buyback does not guarantee permanent supply reduction.
- Market prices can change substantially during the forward unlock window.
- Revenue-funded buybacks may be discretionary and may not continue.
- Cross-token tax, legal, governance, and staking differences are outside the formula.
- A positive net yield is one research input, not a complete valuation model.
