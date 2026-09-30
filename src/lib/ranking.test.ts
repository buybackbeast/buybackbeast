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
  unlockUsd90d: unlocks === null ? null : unlocks / 4,
  inflationaryEmissionsUsd90d: 0,
  unlockUsd180d: unlocks === null ? null : unlocks / 2,
  inflationaryEmissionsUsd180d: 0,
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

  it('can change rank when the user explicitly selects a shorter release horizon', () => {
    const frontLoaded = {
      ...token('FRONT', 300, 400),
      unlockUsd90d: 350,
      unlockUsd180d: 360,
    }
    const backLoaded = {
      ...token('BACK', 200, 500),
      unlockUsd90d: 20,
    }

    expect(rankTokens([frontLoaded, backLoaded]).map((row) => row.input.symbol)).toEqual([
      'FRONT',
      'BACK',
    ])
    expect(
      rankTokens([frontLoaded, backLoaded], {}, 90).map((row) => row.input.symbol),
    ).toEqual(['BACK', 'FRONT'])
  })
})
