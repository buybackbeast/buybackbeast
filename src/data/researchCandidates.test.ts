import { describe, expect, it } from 'vitest'

import { TokenValueCaptureInputSchema } from '../lib/validation'
import {
  RESEARCH_CANDIDATES,
  createCandidateEditorSeed,
  getCandidateCaptureValidationError,
} from './researchCandidates'

describe('research candidate universe', () => {
  it('includes the previously researched non-CeFi candidate universe', () => {
    const symbols = RESEARCH_CANDIDATES.map((candidate) => candidate.symbol)

    expect(symbols).toEqual(expect.arrayContaining([
      'UNI',
      'HYPE',
      'PUMP',
      'CAKE',
      'INJ',
      'LIT',
      'ASTER',
      'SKY',
      'PENDLE',
      'BANANA',
      'BIFI',
      'DYDX',
      'GMX',
      'JUP',
      'RAY',
      'LINK',
      'SYRUP',
      'COW',
    ]))
  })

  it('keeps prior exclusions and CeFi exchange tokens out of the candidate universe', () => {
    const symbols = RESEARCH_CANDIDATES.map((candidate) => candidate.symbol)

    for (const excluded of [
      'FORM',
      'AAVE',
      'GNS',
      'LEO',
      'GT',
      'RLB',
    ]) {
      expect(symbols).not.toContain(excluded)
    }
  })

  it('includes Uniswap as an active fee-funded burn candidate', () => {
    const uniswap = RESEARCH_CANDIDATES.find((candidate) => candidate.symbol === 'UNI')

    expect(uniswap).toMatchObject({
      id: 'uniswap',
      name: 'Uniswap',
      buybackDestination: 'burn',
      programStatus: 'active',
      accounting: {
        recurringCaptureField: 'recurringDirectBurnsUsdInPeriod',
        oneOffContextField: 'oneOffBurnsUsd',
        releasePressureCategory: 'unlocks',
      },
    })
  })

  it('keeps candidate identifiers and symbols unique', () => {
    const ids = RESEARCH_CANDIDATES.map((candidate) => candidate.id.toLowerCase())
    const symbols = RESEARCH_CANDIDATES.map((candidate) => candidate.symbol.toLowerCase())

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(symbols).size).toBe(symbols.length)
  })

  it('keeps every candidate source-linked and dated', () => {
    for (const candidate of RESEARCH_CANDIDATES) {
      expect(candidate.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(candidate.sources.length).toBeGreaterThan(0)
      for (const source of candidate.sources) {
        expect(source.label.trim()).not.toBe('')
        expect(new URL(source.url).protocol).toBe('https:')
      }
    }
  })

  it('cannot be passed directly into the ranking schema', () => {
    const quantitativeKeys = [
      'circulatingMarketCapUsd',
      'executedBuybacksUsdInPeriod',
      'recurringDirectBurnsUsdInPeriod',
      'unlockUsd365d',
      'inflationaryEmissionsUsd365d',
    ]

    for (const candidate of RESEARCH_CANDIDATES) {
      for (const key of quantitativeKeys) {
        expect(key in candidate).toBe(false)
      }
      expect(TokenValueCaptureInputSchema.safeParse(candidate).success).toBe(false)
    }
  })

  it('prefills a separate dated snapshot without inventing executed capture', () => {
    const uniswap = RESEARCH_CANDIDATES[0]
    const seed = createCandidateEditorSeed(uniswap)

    expect(seed).toMatchObject({
      circulatingMarketCapUsd: 5_627_000_000,
      fdvUsd: 9_070_000_000,
      unlockUsd90d: 45_350_000,
      unlockUsd180d: 90_700_000,
      unlockUsd365d: 181_400_000,
      inflationaryEmissionsUsd90d: 0,
      inflationaryEmissionsUsd180d: 0,
      inflationaryEmissionsUsd365d: 0,
      dataDate: '2026-09-30',
    })
    expect(seed.sourceUrls).toContain('https://defillama.com/unlocks/uniswap')
    expect(seed.sourceUrls).toContain('https://dune.com/uniswaplabs/uni-burn-tracker-l1l2')
    expect(seed.evidenceLevel).toBe('estimate')
    expect('capturePeriodDays' in seed).toBe(false)
    expect('recurringDirectBurnsUsdInPeriod' in seed).toBe(false)
  })

  it('prefills mechanism provenance when a quantitative snapshot is still pending', () => {
    const hyperliquid = RESEARCH_CANDIDATES.find((candidate) => candidate.symbol === 'HYPE')

    expect(hyperliquid).toBeDefined()
    const seed = createCandidateEditorSeed(hyperliquid!)

    expect(seed).toMatchObject({
      circulatingMarketCapUsd: 0,
      fdvUsd: 0,
      unlockUsd90d: null,
      inflationaryEmissionsUsd90d: null,
      dataDate: '2026-09-30',
    })
    expect(seed.sourceUrls).toEqual(hyperliquid?.sources.map((source) => source.url))
  })

  it('blocks a candidate from ranking until its verified capture field is completed', () => {
    const uniswap = RESEARCH_CANDIDATES[0]
    const incomplete = {
      capturePeriodDays: 0,
      executedBuybacksUsdInPeriod: 0,
      recurringDirectBurnsUsdInPeriod: 0,
      holderDistributionsUsdInPeriod: 0,
    }

    expect(getCandidateCaptureValidationError(uniswap, incomplete)).toContain('observation window')
    expect(getCandidateCaptureValidationError(uniswap, {
      ...incomplete,
      capturePeriodDays: 365,
    })).toContain('positive executed capture')
    expect(getCandidateCaptureValidationError(uniswap, {
      ...incomplete,
      capturePeriodDays: 365,
      recurringDirectBurnsUsdInPeriod: 25_600_000,
    })).toBeNull()
  })

  it.each([
    ['HYPE', 'executedBuybacksUsdInPeriod'],
    ['UNI', 'recurringDirectBurnsUsdInPeriod'],
    ['INJ', 'holderDistributionsUsdInPeriod'],
  ] as const)('requires the configured recurring field for %s', (symbol, field) => {
    const candidate = RESEARCH_CANDIDATES.find((item) => item.symbol === symbol)
    expect(candidate).toBeDefined()

    const input = {
      capturePeriodDays: 365,
      executedBuybacksUsdInPeriod: 0,
      recurringDirectBurnsUsdInPeriod: 0,
      holderDistributionsUsdInPeriod: 0,
      [field]: 1,
    }

    expect(getCandidateCaptureValidationError(candidate!, input)).toBeNull()
  })
})
