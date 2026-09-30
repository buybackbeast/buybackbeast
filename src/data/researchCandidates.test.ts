import { describe, expect, it } from 'vitest'

import { TokenValueCaptureInputSchema } from '../lib/validation'
import { RESEARCH_CANDIDATES } from './researchCandidates'

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
      expect(candidate.mechanismLabel.trim()).not.toBe('')
      expect(candidate.mechanismTooltip.trim().length).toBeGreaterThan(60)
      expect(candidate.mechanismTooltip.length).toBeLessThanOrEqual(200)
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
      'unlockUsd7d',
      'inflationaryEmissionsUsd7d',
      'unlockUsd30d',
      'inflationaryEmissionsUsd30d',
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

})
