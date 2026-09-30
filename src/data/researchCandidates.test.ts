import { describe, expect, it } from 'vitest'

import { TokenValueCaptureInputSchema } from '../lib/validation'
import {
  RESEARCH_CANDIDATES,
  createCandidateEditorSeed,
  getCandidateCaptureValidationError,
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
})
