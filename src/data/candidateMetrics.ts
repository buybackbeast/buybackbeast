import Decimal from 'decimal.js'

import type { ReleaseHorizonDays } from '../lib'

export const CANDIDATE_METRIC_QUALITIES = [
  'verified',
  'estimate',
  'unavailable',
] as const

export type CandidateMetricQuality = (typeof CANDIDATE_METRIC_QUALITIES)[number]

export interface CandidateMetricAmount {
  usd: number | null
  quality: CandidateMetricQuality
  note: string
}

export interface CandidateBuybackObservation extends CandidateMetricAmount {
  periodDays: number | null
  periodStart: string | null
  periodEnd: string | null
}

export type CandidateReleaseSeries = Readonly<
  Record<ReleaseHorizonDays, CandidateMetricAmount>
>

export interface CandidateMetricSnapshot {
  candidateId: string
  asOfDate: string
  buyback: CandidateBuybackObservation
  /** Cumulative known unlocks and inflationary issuance inside each forward window. */
  releaseUsd: CandidateReleaseSeries
  notes: readonly string[]
  sourceUrls: readonly string[]
}

export interface CalculatedCandidateMetrics {
  candidateId: string
  horizonDays: ReleaseHorizonDays
  buybackUsd: number | null
  buybackQuality: CandidateMetricQuality
  unlockUsd: number | null
  unlockQuality: CandidateMetricQuality
  netUsd: number | null
  netPct: number | null
  netQuality: CandidateMetricQuality
}

export interface CandidateMetricRankInput {
  candidateId: string
  netPct: number | null | undefined
}

export type RankedCandidateMetricRow<T extends CandidateMetricRankInput> = T & {
  rank: number | null
}

type HorizonValues = readonly [number | null, number | null, number | null, number | null, number | null]

const HORIZONS = [7, 30, 90, 180, 365] as const

function amount(
  usd: number | null,
  quality: CandidateMetricQuality,
  note: string,
): CandidateMetricAmount {
  return { usd, quality, note }
}

function releases(
  values: HorizonValues,
  quality: CandidateMetricQuality,
  note: string,
): CandidateReleaseSeries {
  return {
    7: amount(values[0], quality, note),
    30: amount(values[1], quality, note),
    90: amount(values[2], quality, note),
    180: amount(values[3], quality, note),
    365: amount(values[4], quality, note),
  }
}

function annualReleaseSeries(
  annualUsd: number,
  quality: CandidateMetricQuality,
  note: string,
): CandidateReleaseSeries {
  return releases(
    HORIZONS.map((days) => annualUsd * days / 365) as unknown as HorizonValues,
    quality,
    note,
  )
}

/**
 * Research snapshot dated 2026-09-30. Estimates are deliberately explicit:
 * they are useful scenarios, not claims that every token will be sold.
 */
export const CANDIDATE_METRICS = [
  {
    candidateId: 'uniswap',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 25_600_000,
      quality: 'estimate',
      periodDays: 203,
      periodStart: '2025-12-28',
      periodEnd: '2026-07-18',
      note: 'Official approximate USD value of 7.5M UNI burned since fee activation; the activation date is approximate.',
    },
    releaseUsd: releases(
      [45_350_000, 45_350_000, 45_350_000, 90_700_000, 181_400_000],
      'estimate',
      'Original UNI allocation vesting ended in September 2025. These amounts are discrete 5M UNI quarterly transfers from the governance treasury to the Labs growth budget, valued at $9.07. In this September 30 snapshot, the 7d, 30d, and 90d windows all include the same October 1 event. They are not continuous issuance, the allowance is revocable, and a transfer does not imply a sale.',
    ),
    notes: ['The separate 100M UNI treasury burn is excluded as a one-off.'],
    sourceUrls: [
      'https://gov.uniswap.org/t/temp-check-activate-v4-protocol-fees/26162',
      'https://dune.com/uniswaplabs/uni-burn-tracker-l1l2',
      'https://github.com/buybackbeast/buybackbeast/blob/main/docs/evidence/uniswap-univesting-2026-09-30.json',
    ],
  },
  {
    candidateId: 'hyperliquid',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 37_141_140.29274,
      quality: 'verified',
      periodDays: 18,
      periodStart: '2026-09-12',
      periodEnd: '2026-09-29',
      note: 'Assistance Fund fills from complete UTC days; the short observation window makes extrapolation provisional.',
    },
    releaseUsd: releases(
      [857_584_000, 857_584_000, 2_572_752_000, 5_145_504_000, 10_291_008_000],
      'estimate',
      'Third-party contributor schedule scenario of 9.92M HYPE monthly, valued at $86.45; variable staking emissions are excluded.',
    ),
    notes: ['Fee-funded purchases and their subsequent burn are counted once.'],
    sourceUrls: [
      'https://api.hyperliquid.xyz/info',
      'https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees',
      'https://defillama.com/unlocks/hyperliquid',
    ],
  },
  {
    candidateId: 'pump-fun',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 347_997_769.2863614,
      quality: 'verified',
      periodDays: 365,
      periodStart: '2025-09-30',
      periodEnd: '2026-09-29',
      note: 'Sum of the official dashboard daily USD rows for a complete trailing year.',
    },
    releaseUsd: releases(
      [0, 38_898_750, 116_696_250, 233_392_500, 466_785_000],
      'estimate',
      'Scenario of 6.875B PUMP monthly team and investor releases from October 14, valued at $0.005658; the official page lacks a complete schedule.',
    ),
    notes: ['Custom-pair activity that the official dashboard omits is not extrapolated.'],
    sourceUrls: [
      'https://pump.fun/pump-token',
      'https://pump.fun/docs/april-28-announcement',
      'https://defillama.com/unlocks/pump',
    ],
  },
  {
    candidateId: 'pancakeswap',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 7_175_921.95160294,
      quality: 'estimate',
      periodDays: 31,
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      note: '2,746,334 CAKE burned valued at the snapshot price; this is not disclosed cash spend and can include direct fee burns.',
    },
    releaseUsd: releases(
      [396_972.17, 1_587_888.67, 5_160_638.17, 10_321_276.34, 20_642_552.68],
      'estimate',
      'Latest disclosed weekly farm, pool, and lottery emissions repeated forward; legacy allocation vesting is fully unlocked.',
    ),
    notes: ['The August gross burn is shown as a transparent estimate, not an audited open-market buyback cost.'],
    sourceUrls: [
      'https://blog.pancakeswap.finance/articles/august-cake-burn-report',
      'https://pancakeswap.finance/burn-dashboard',
      'https://defillama.com/unlocks/pancakeswap',
    ],
  },
  {
    candidateId: 'injective',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 776_344.28,
      quality: 'estimate',
      periodDays: 130,
      periodStart: '2025-11-01',
      periodEnd: '2026-03-10',
      note: 'Official revenue assets distributed across the first four rounds; the observation starts at an approximate November 1 boundary because exact round dates were not disclosed.',
    },
    releaseUsd: releases(
      [762_663.03, 3_268_555.86, 9_805_667.57, 19_611_335.13, 39_767_429.57],
      'estimate',
      'Current onchain annual-provisions rate prorated forward; legacy allocation vesting is complete and minting can change with bonded ratio.',
    ),
    notes: ['The revenue basket and corresponding INJ burn are counted once.'],
    sourceUrls: [
      'https://injective.com/blog/2026-injective-community-buy-back-guide',
      'https://sentry.lcd.injective.network/cosmos/mint/v1beta1/annual_provisions',
      'https://tokenomist.ai/injective-protocol',
    ],
  },
  {
    candidateId: 'lighter',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 23_000_000,
      quality: 'estimate',
      periodDays: 194,
      periodStart: '2026-01-05',
      periodEnd: '2026-07-17',
      note: 'Third-party onchain estimate for 16,000,294.58 LIT purchases; official material confirms the mechanism but not USD spend.',
    },
    releaseUsd: releases(
      [0, 0, 0, 160_235_480.47, 493_309_232],
      'estimate',
      'Known minimum team and investor schedule only, valued at $3.946473856; the 25% ecosystem allocation has no fixed public schedule.',
    ),
    notes: ['Repurchased LIT is conservatively treated as treasury-held rather than burned.'],
    sourceUrls: [
      'https://docs.lighter.xyz/about-lighter/lit-utility',
      'https://tg.me/lighter_announcements/432',
      'https://tokenomist.ai/research/lighter-lit-tokenomics-robinhood-hype-a-real-burn-and-the-december-2026-cliff-2',
    ],
  },
  {
    candidateId: 'aster',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 3_226_264.03794175,
      quality: 'estimate',
      periodDays: 15,
      periodStart: '2026-09-07',
      periodEnd: '2026-09-21',
      note: '4,166,388.85 ASTER purchased for stakers, valued at the $0.774355 snapshot price.',
    },
    releaseUsd: releases(
      [348_459.75, 3_136_137.75, 8_014_574.25, 17_670_781.1, 46_817_503.3],
      'estimate',
      'Known 450K weekly and 2.25M monthly ecosystem releases, with disclosed vesting events, valued at $0.774355.',
    ),
    notes: ['The matching reserve burn is not added again to the fee-funded staker distribution.'],
    sourceUrls: [
      'https://docs.asterdex.com/usdaster-token/tokenomics',
      'https://x.com/Aster_DEX/status/2101932486364455037',
      'https://defillama.com/unlocks/aster',
    ],
  },
  {
    candidateId: 'sky',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 1_150_000,
      quality: 'verified',
      periodDays: 30,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      note: 'USDS deployed by the official onchain buyback dashboard over its latest 30-day view.',
    },
    releaseUsd: releases([0, 0, 0, 0, 0], 'verified', 'SKY has a capped supply, disabled new emissions, and no scheduled token unlocks.'),
    notes: ['Migration-offset and one-time treasury burns are excluded.'],
    sourceUrls: [
      'https://financial.skyeco.com/buybacks',
      'https://sky.money/blog/understanding-the-sky-token',
    ],
  },
  {
    candidateId: 'pendle',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 417_512,
      quality: 'estimate',
      periodDays: 30,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      note: 'DefiLlama 30-day holder revenue used as a proxy for sPENDLE buyback distributions.',
    },
    releaseUsd: annualReleaseSeries(14_836_800, 'estimate', 'Terminal 2% annual inflation on approximately 281M PENDLE, valued at $2.64 and prorated by day.'),
    notes: ['Team and investor vesting completed in September 2024.'],
    sourceUrls: [
      'https://defillama.com/protocol/pendle',
      'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/Mechanisms/sPENDLE',
      'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/Mechanisms/Tokenomics',
    ],
  },
  {
    candidateId: 'banana-gun',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 8_500,
      quality: 'estimate',
      periodDays: 7,
      periodStart: '2026-03-16',
      periodEnd: '2026-03-22',
      note: 'Official weekly recap holder distribution; exact week boundaries are inferred from the recap sequence.',
    },
    releaseUsd: annualReleaseSeries(663_333.3333333333, 'estimate', 'Known-minimum 500K team allocation linear over 36 months, valued at $3.98; adjustable treasury bonus emissions are excluded.'),
    notes: ['This release scenario is a minimum, not a complete forecast.'],
    sourceUrls: [
      'https://blog.bananagun.io/blog/banana-gun-weekly-recap-solana-performance-upgrades-evm-expansion-zero-fee-stablecoin-pairs',
      'https://docs.bananagun.io/banana-token/tokenomics',
    ],
  },
  {
    candidateId: 'beefy',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 32_571,
      quality: 'estimate',
      periodDays: 30,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      note: 'DefiLlama 30-day holder revenue proxy; the formerly documented official aggregate buyback endpoint currently returns 404.',
    },
    releaseUsd: releases([0, 0, 0, 0, 0], 'verified', 'Fixed 80,000 BIFI supply was fully distributed by July 2022 and the token has no mint function.'),
    notes: ['Discretionary, unverified BIP-99 purchases are excluded.'],
    sourceUrls: [
      'https://defillama.com/protocol/beefy',
      'https://docs.beefy.finance/ecosystem/bifi-token',
      'https://docs.beefy.finance/developer-documentation/beefy-api',
    ],
  },
  {
    candidateId: 'dydx',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 128_016.09,
      quality: 'verified',
      periodDays: 31,
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      note: 'Official August Treasury SubDAO spend across 4,208 orders.',
    },
    releaseUsd: releases([0, 0, 0, 0, 0], 'verified', 'Original vesting ended June 1, 2026 and the production chain has no active mint module.'),
    notes: ['Purchased DYDX is staked and remains DAO-controlled.'],
    sourceUrls: [
      'https://dydx.forum/t/dydx-treasury-subdao-community-update-august-2026/5151',
      'https://docs.dydx.community/dydx/start-here/dydx-token-allocation',
      'https://dydx-rest.publicnode.com/cosmos/bank/v1beta1/supply/by_denom?denom=adydx',
    ],
  },
  {
    candidateId: 'gmx',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 1_100_000,
      quality: 'estimate',
      periodDays: 65,
      periodStart: '2026-03-05',
      periodEnd: '2026-05-08',
      note: 'Official report gives approximately $1.1M for 168,500 GMX purchases.',
    },
    releaseUsd: annualReleaseSeries(5_649_455.5, 'estimate', 'Rough scenario for 700,925 remaining locked GMX released over 365 days at $8.06; user-timed esGMX vesting is dynamic.'),
    notes: ['Treasury GMX is not treated as burned.'],
    sourceUrls: [
      'https://gmxio.substack.com/p/a-new-chapter-for-gmx-labs-ceo-appointed',
      'https://docs.gmx.io/docs/tokenomics/gmx-token/',
      'https://docs.gmx.io/docs/tokenomics/rewards/',
    ],
  },
  {
    candidateId: 'jupiter',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 2_775_437.351424,
      quality: 'estimate',
      periodDays: 30,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      note: '8,504,064 September JUP purchases valued at the $0.326366 snapshot price; actual cash cost was not disclosed.',
    },
    releaseUsd: releases([0, 0, 0, 0, 0], 'verified', 'Current adopted net-zero schedule uses already-circulating tokens and has no new emissions, subject to future governance.'),
    notes: ['Current Litterbox holdings are treasury assets, not automatically burned.'],
    sourceUrls: [
      'https://x.com/litterboxtrust',
      'https://discuss.jup.ag/t/proposal-net-zero-emissions/39948',
      'https://coinmarketcap.com/currencies/jupiter-ag/',
    ],
  },
  {
    candidateId: 'raydium',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 100_900_000,
      quality: 'estimate',
      periodDays: 365,
      periodStart: '2025-01-01',
      periodEnd: '2025-12-31',
      note: 'Rounded official investor-report amount directed to and deployed in RAY buybacks during calendar 2025; it is not a trailing-current observation.',
    },
    releaseUsd: annualReleaseSeries(3_857_000, 'estimate', 'Approximately 1.9M RAY annual mining-reserve emissions valued at $2.03 and prorated by day.'),
    notes: ['The public holding wallet is treasury-controlled and is not a burn.'],
    sourceUrls: [
      'https://blockworks.com/api/investor-report/investor-relations-report/pdf',
      'https://docs.raydium.io/ray/ray-buybacks',
      'https://docs.raydium.io/ray',
    ],
  },
  {
    candidateId: 'chainlink',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 20_894_400,
      quality: 'estimate',
      periodDays: 91,
      periodStart: '2026-04-01',
      periodEnd: '2026-06-30',
      note: '1.44M LINK accumulated in Q2 valued at the $14.51 snapshot price; this is not disclosed execution cost.',
    },
    releaseUsd: annualReleaseSeries(1_015_700_000, 'estimate', 'Official 70M LINK annual release schedule valued at $14.51 and prorated by day.'),
    notes: ['Reserve LINK remains protocol-controlled and is not burned.'],
    sourceUrls: [
      'https://chain.link/blog/quarterly-review-q2-2026',
      'https://chain.link/circulating-supply',
    ],
  },
  {
    candidateId: 'maple-finance',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 283_866,
      quality: 'verified',
      periodDays: 62,
      periodStart: '2026-07-01',
      periodEnd: '2026-08-31',
      note: 'Sum of official July and August purchase costs under MIP-021.',
    },
    releaseUsd: releases(
      [9_166_873.2764, 9_166_873.2764, 9_166_873.2764, 9_166_873.2764, 9_166_873.2764],
      'estimate',
      'Known final legacy issuance of 39.1342M SYRUP by October, valued at $0.234242; timing within the short windows is conservatively front-loaded.',
    ),
    notes: ['Strategic Fund holdings may be redeployed and are not burned.'],
    sourceUrls: [
      'https://maple.finance/transparency',
      'https://community.maple.finance/t/mip-010-syrup-token-launch-and-mpl-syrup-conversion/334',
    ],
  },
  {
    candidateId: 'cow-protocol',
    asOfDate: '2026-09-30',
    buyback: {
      usd: 13_217_380.802516,
      quality: 'estimate',
      periodDays: 752,
      periodStart: '2024-04-17',
      periodEnd: '2026-05-08',
      note: '78,616,859 executed COW purchases valued at the $0.168124 snapshot price; actual aggregate spend was not disclosed.',
    },
    releaseUsd: annualReleaseSeries(8_547_119.156107947, 'estimate', 'Observed solver-emission run rate plus 1M COW monthly team compensation and 125K weekly grants, valued at $0.168124.'),
    notes: ['DAO-controlled bought tokens can fund later rewards, so buyback and reuse must not be double-counted.'],
    sourceUrls: [
      'https://forum.cow.fi/t/cow-daos-path-to-value-distribution-core-team-view/3454',
      'https://forum.cow.fi/t/cow-token-buyback-an-update-on-1-year-of-execution/3168',
    ],
  },
] as const satisfies readonly CandidateMetricSnapshot[]

export function getCandidateMetricSnapshot(candidateId: string): CandidateMetricSnapshot | undefined {
  return CANDIDATE_METRICS.find((snapshot) => snapshot.candidateId === candidateId)
}

function derivedQuality(
  buybackQuality: CandidateMetricQuality,
  releaseQuality: CandidateMetricQuality,
): CandidateMetricQuality {
  if (buybackQuality === 'unavailable' || releaseQuality === 'unavailable') return 'unavailable'
  return buybackQuality === 'verified' && releaseQuality === 'verified'
    ? 'verified'
    : 'estimate'
}

export function calculateCandidateMetrics(
  snapshot: CandidateMetricSnapshot,
  horizonDays: ReleaseHorizonDays,
  circulatingMarketCapUsd: number,
): CalculatedCandidateMetrics {
  if (!Number.isFinite(circulatingMarketCapUsd) || circulatingMarketCapUsd <= 0) {
    throw new RangeError('circulatingMarketCapUsd must be a positive finite number')
  }

  const observation = snapshot.buyback
  const release = snapshot.releaseUsd[horizonDays]
  const canCalculateBuyback = observation.usd !== null
    && observation.periodDays !== null
    && observation.periodDays > 0
  const buybackUsd = canCalculateBuyback
    ? new Decimal(observation.usd!).times(horizonDays).div(observation.periodDays!).toNumber()
    : null
  const buybackQuality: CandidateMetricQuality = buybackUsd === null
    ? 'unavailable'
    : observation.quality === 'verified' && observation.periodDays === horizonDays
      ? 'verified'
      : 'estimate'
  const unlockUsd = release.usd
  const unlockQuality: CandidateMetricQuality = unlockUsd === null
    ? 'unavailable'
    : release.quality
  const netUsd = buybackUsd === null || unlockUsd === null
    ? null
    : new Decimal(buybackUsd).minus(unlockUsd).toNumber()
  const netPct = netUsd === null
    ? null
    : new Decimal(netUsd).div(circulatingMarketCapUsd).times(100).toNumber()

  return {
    candidateId: snapshot.candidateId,
    horizonDays,
    buybackUsd,
    buybackQuality,
    unlockUsd,
    unlockQuality,
    netUsd,
    netPct,
    netQuality: netUsd === null
      ? 'unavailable'
      : derivedQuality(buybackQuality, unlockQuality),
  }
}

export function calculateCandidateMetricsById(
  candidateId: string,
  horizonDays: ReleaseHorizonDays,
  circulatingMarketCapUsd: number,
): CalculatedCandidateMetrics | undefined {
  const snapshot = getCandidateMetricSnapshot(candidateId)
  return snapshot === undefined
    ? undefined
    : calculateCandidateMetrics(snapshot, horizonDays, circulatingMarketCapUsd)
}

export function rankCandidateMetricRows<T extends CandidateMetricRankInput>(
  rows: readonly T[],
): RankedCandidateMetricRow<T>[] {
  const sorted = [...rows].sort((left, right) => {
    const leftAvailable = left.netPct !== null
      && left.netPct !== undefined
      && Number.isFinite(left.netPct)
    const rightAvailable = right.netPct !== null
      && right.netPct !== undefined
      && Number.isFinite(right.netPct)

    if (!leftAvailable) return rightAvailable ? 1 : left.candidateId.localeCompare(right.candidateId)
    if (!rightAvailable) return -1
    return right.netPct! - left.netPct! || left.candidateId.localeCompare(right.candidateId)
  })

  let rank = 0
  return sorted.map((row) => ({
    ...row,
    rank: row.netPct !== null && row.netPct !== undefined && Number.isFinite(row.netPct)
      ? ++rank
      : null,
  }))
}
