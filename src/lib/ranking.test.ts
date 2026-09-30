import { describe, expect, it } from 'vitest'

import { rankTokens } from './ranking'
import type { TokenValueCaptureInput } from './types'

const token = (
  symbol: string,
  buybacks: number,
  unlocks: number | null,
): TokenValueCaptureInput => ({
  name: `${symbol} Protocol`,
  symbol,
  circulatingMarketCapUsd: 1_000,
  fdvUsd: 1_500,
  capturePeriodDays: 365,
  executedBuybacksUsdInPeriod: buybacks,
  recurringDirectBurnsUsdInPeriod: 0,
  holderDistributionsUsdInPeriod: 0,
  boughtAndBurnedUsdInPeriod: buybacks,
  announcedBuybacksUsd: 0,
  oneOffBurnsUsd: 0,
  unlockUsd365d: unlocks,
  inflationaryEmissionsUsd365d: 0,
  buybackDestination: 'burn',
  evidenceLevel: 'official',
  programStatus: 'active',
  dataDate: '2026-09-30',
  sourceUrls: [`https://example.com/${symbol.toLowerCase()}`],
})

describe('rankTokens', () => {
  it('ranks by signed net capture yield and leaves incomplete rows NR', () => {
    const ranked = rankTokens([
      token('LOW', 100, 200),
      token('NR', 900, null),
      token('HIGH', 200, 50),
    ])

    expect(ranked.map((row) => [row.input.symbol, row.rank])).toEqual([
      ['HIGH', 1],
      ['LOW', 2],
      ['NR', null],
    ])
  })
})
