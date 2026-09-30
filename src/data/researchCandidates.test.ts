import { describe, expect, it } from 'vitest'

import { TokenValueCaptureInputSchema } from '../lib/validation'
import {
  RESEARCH_CANDIDATES,
  createCandidateEditorSeed,
} from './researchCandidates'

describe('research candidate universe', () => {
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

  it('does not treat mechanism references as quantitative snapshot sources', () => {
    const uniswap = RESEARCH_CANDIDATES[0]
    const seed = createCandidateEditorSeed(uniswap)

    expect(seed.sourceUrls).toEqual([])
    expect(seed.evidenceLevel).toBe('estimate')
  })
})
