import { describe, expect, it } from 'vitest'

import { TokenValueCaptureInputSchema } from './validation'

const valid = {
  name: 'Test',
  symbol: 'test',
  circulatingMarketCapUsd: 100,
  fdvUsd: 120,
  capturePeriodDays: 365,
  executedBuybacksUsdInPeriod: 10,
  recurringDirectBurnsUsdInPeriod: 0,
  holderDistributionsUsdInPeriod: 0,
  boughtAndBurnedUsdInPeriod: 10,
  announcedBuybacksUsd: 0,
  oneOffBurnsUsd: 0,
  unlockUsd90d: 0,
  inflationaryEmissionsUsd90d: 0,
  unlockUsd180d: 0,
  inflationaryEmissionsUsd180d: 0,
  unlockUsd365d: 0,
  inflationaryEmissionsUsd365d: 0,
  buybackDestination: 'burn',
  evidenceLevel: 'official',
  programStatus: 'active',
  dataDate: '2026-09-30',
  sourceUrls: ['https://example.com'],
} as const

describe('TokenValueCaptureInputSchema', () => {
  it('normalizes the symbol and accepts explicit zero releases', () => {
    const parsed = TokenValueCaptureInputSchema.parse(valid)
    expect(parsed.symbol).toBe('TEST')
    expect(parsed.unlockUsd365d).toBe(0)
  })

  it('rejects double counting above executed buybacks', () => {
    const result = TokenValueCaptureInputSchema.safeParse({
      ...valid,
      boughtAndBurnedUsdInPeriod: 11,
    })
    expect(result.success).toBe(false)
  })

  it('requires at least 90 days before annualizing a run rate', () => {
    const result = TokenValueCaptureInputSchema.safeParse({
      ...valid,
      capturePeriodDays: 30,
    })
    expect(result.success).toBe(false)
  })

  it('normalizes legacy inputs without shorter release horizons', () => {
    const legacy: Record<string, unknown> = { ...valid }
    delete legacy.unlockUsd90d
    delete legacy.inflationaryEmissionsUsd90d
    delete legacy.unlockUsd180d
    delete legacy.inflationaryEmissionsUsd180d
    const parsed = TokenValueCaptureInputSchema.parse(legacy)

    expect(parsed.unlockUsd90d).toBeNull()
    expect(parsed.inflationaryEmissionsUsd90d).toBeNull()
    expect(parsed.unlockUsd180d).toBeNull()
    expect(parsed.inflationaryEmissionsUsd180d).toBeNull()
  })

  it('rejects release values that decrease across cumulative horizons', () => {
    const result = TokenValueCaptureInputSchema.safeParse({
      ...valid,
      unlockUsd90d: 20,
      unlockUsd180d: 10,
      unlockUsd365d: 30,
    })

    expect(result.success).toBe(false)
  })
})
